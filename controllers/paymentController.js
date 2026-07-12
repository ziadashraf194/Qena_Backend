

import crypto from "crypto";
import axios from "axios";
import Application from "../models/Application.js";

export const initiatePayment = async (req, res) => {
    try {
        const { applicationId } = req.body;

        // جلب طلب التقديم والتأكد من وجوده ومطابقته للطالب
        const application = await Application.findById(applicationId)
            .populate("studentDataId")
            .populate("facultyId");

        if (!application) {
            return res.status(404).json({ status: "error", message: "طلب التقديم غير موجود" });
        }

        if (application.paymentStatus === "PAID") {
            return res.status(400).json({ status: "error", message: "هذا الطلب مدفوع بالفعل" });
        }

        // لوجيك الـ 3 أيام: إذا كان الكود موجوداً ولم ينتهِ، نرجعه مباشرة
        if (application.fawryReferenceNumber && application.paymentExpiry && new Date() < application.paymentExpiry) {
            return res.status(200).json({
                status: "success",
                message: "لديك كود دفع قائم بالفعل وصالح للاستخدام",
                data: {
                    fawryReferenceNumber: application.fawryReferenceNumber,
                    merchantRefNum: `${application.studentDataId._id.toString()}_${application.facultyId._id.toString()}`,
                    amount: application.facultyId.applicationFee.toFixed(2),
                    expiryDate: application.paymentExpiry
                }
            });
        }

        const student = application.studentDataId;
        const faculty = application.facultyId;

        // بناء الـ merchantRefNum الفريد (دمج ID الطالب مع ID الكلية بـ _)
        const merchantRefNum = `${student._id.toString()}_${faculty._id.toString()}`;
        const amount = faculty.applicationFee.toFixed(2); // رقم عشري بصيغة نصية xx.xx
        const paymentMethod = "PayAtFawry";
        const customerProfileId = student._id.toString();

        // 🌟 حساب الـ Signature الصارم بناءً على توثيق V1 المرفق:
        // merchantCode + merchantRefNum + customerProfileId + paymentMethod + amount + secureKey
        const signatureSource = 
            process.env.FAWRY_MERCHANT_CODE + 
            merchantRefNum + 
            customerProfileId + 
            paymentMethod + 
            amount + 
            process.env.FAWRY_SECURE_KEY;

        const signature = crypto.createHash("sha256").update(signatureSource).digest("hex");

        // حساب وقت انتهاء الكود (3 أيام بالملي ثانية)
        const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
        const expiryTimestamp = Date.now() + threeDaysInMs;

        // 🌟 بناء الـ Payload المطابق تماماً للـ Sample Request الخاص بالرابط الذي تستخدمه
        const paymentPayload = {
            merchantCode: process.env.FAWRY_MERCHANT_CODE,
            customerName: `${student.firstName} ${student.secondName} ${student.thirdName} ${student.fourthName}`.trim(),
            customerMobile: student.phone,
            customerEmail: student.email || "student@university.edu",
            customerProfileId: customerProfileId,
            merchantRefNum: merchantRefNum,
            amount: amount,
            paymentExpiry: expiryTimestamp.toString(), // يفضل إرساله كـ String أو رقم طبقاً للتوثيق
            currencyCode: "EGP",
            language: "ar-eg",
            chargeItems: [
                {
                    itemId: faculty._id.toString(),
                    description: `رسوم تقديم - ${faculty.name}`,
                    price: amount,
                    quantity: "1"
                }
            ],
            signature: signature,
            paymentMethod: paymentMethod,
            description: `تقديم طالب - ${faculty.name}`
        };

        // إرسال الطلب المباشر لرابط الـ Production المخزن في الـ .env
        const response = await axios.post(process.env.FAWRY_CHARGE_URL, paymentPayload, {
            headers: {
                "Content-Type": "application/json"
            }
        });

        // التحقق من استجابة فوري (يرجع statusCode كـ رقم أو نص طبقاً للرد)
        if (response.data && (response.data.statusCode === 200 || response.data.statusCode === "200")) {
            const generatedRefNumber = response.data.referenceNumber;
            const finalExpiryDate = new Date(expiryTimestamp);

            // حفظ البيانات في الأبليكيشن لتثبيتها للطالب
            application.fawryReferenceNumber = generatedRefNumber;
            application.paymentExpiry = finalExpiryDate;
            await application.save();

            return res.status(200).json({
                status: "success",
                message: "تم توليد كود الدفع بنجاح وحفظه في النظام",
                data: {
                    fawryReferenceNumber: generatedRefNumber, 
                    merchantRefNum: merchantRefNum,
                    amount: amount,
                    expiryDate: finalExpiryDate
                }
            });
        } else {
            return res.status(400).json({ 
                status: "error", 
                message: response.data.statusDescription || "فشل توليد الكود من سيرفر فوري المباشر" 
            });
        }

    } catch (error) {
        console.error("Fawry Production Initiate Error:", error.response?.data || error.message);
        return res.status(500).json({ status: "error", message: "internal server error" });
    }
};

export const fawryCallback = async (req, res) => {
    try {
        // فوري يرسل هذه الحقول بالكامل في الـ Body الخاص بالـ Webhook
        const {
            referenceNumber,     // رقم العملية في فوري (يعادل fawryRefNumber في V1)
            merchantRefNumber,   // الـ ID المدمج (studentId_facultyId)
            paymentAmount,       // المبلغ المدفوع فعلياً
            orderAmount,         // مبلغ الطلب الأصلي
            orderStatus,         // الحالة (PAID)
            paymentMethod,       // طريقة الدفع (PayAtFawry)
            fawryFees,           // مصاريف فوري
            customerMail,        // إيميل الطالب
            customerMobile,      // موبايل الطالب
            signature            // الـ الهاش القادم من فوري للمقارنة
        } = req.body;

        console.log(`[Fawry Webhook] Received for Order: ${merchantRefNumber}, Status: ${orderStatus}`);

        // 1. تحويل المبالغ بصيغة رقمين عشريين ونص دقيق (xx.xx) كما يطلب فوري
        const formattedPaymentAmount = parseFloat(paymentAmount).toFixed(2);
        const formattedOrderAmount = parseFloat(orderAmount).toFixed(2);
        const formattedFawryFees = parseFloat(fawryFees).toFixed(2);

        // 2. تجميع النص بنفس ترتيب التوثيق الرسمي المرفق بالملي
        const signatureSource = 
            (referenceNumber || '') + 
            (merchantRefNumber || '') + 
            formattedPaymentAmount + 
            formattedOrderAmount + 
            (orderStatus || '') + 
            (paymentMethod || '') + 
            formattedFawryFees + 
            (customerMail || '') + 
            (customerMobile || '') + 
            process.env.FAWRY_SECURE_KEY;

        // 3. توليد الـ الهاش المقارن
        const computedSignature = crypto.createHash("sha256").update(signatureSource).digest("hex");

        if (computedSignature !== signature) {
            console.error("⚠️ تحذير أمني: الـ Signature القادم من فوري غير متطابق!");
            // نصيحة: أثناء الديفلوبمنت فقط يمكنك عمل تعليق للسطر التالي لتجربة الـ flow اليدوي بالكامل
            return res.status(400).send("Blank or invalid signature");
        }

        // 4. إذا كانت حالة الطلب PAID، نحدث قاعدة البيانات
        if (orderStatus === "PAID") {
            const [studentDataId, facultyId] = merchantRefNumber.split("_");

            const application = await Application.findOne({
                studentDataId: studentDataId,
                facultyId: facultyId
            });

            if (!application) {
                console.error(`طلب التقديم غير موجود للبيانات: ${merchantRefNumber}`);
                return res.status(404).send("Application not found");
            }

            application.paymentStatus = "PAID";
            application.successfulTransactionId = referenceNumber; // حفظ كود المعاملة
            await application.save();

            console.log(`✅ تم تحديث طلب التقديم ${application._id} بنجاح إلى PAID`);
        }

        // فوري ينتظر حالة 200 لتأكيد الاستلام وثبات العملية
        return res.status(200).send("SUCCESS");

    } catch (error) {
        console.error("Fawry Callback Error:", error);
        return res.status(500).send("Internal Server Error");
    }
};