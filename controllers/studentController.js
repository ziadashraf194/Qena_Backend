import StudentData from "../models/StudentData.js";

export const fillStudentProfile = async (req, res) => {
    try {
        const {
            firstName,
            secondName,
            thirdName,
            fourthName,
            birthDate,
            gender,
            address,
            phone,
            whatsapp,
            email,
            percentage,
            score,
            nationalIdImage,
            certificateImage,
            parent
        } = req.body;

        // 1. التأكد إن الطالب ده مملاش بياناته قبل كده (لأن الحقل فريد unique: true في الاسكيما)
        const profileExists = await StudentData.findOne({ user: req.user.id });
        if (profileExists) {
            return res.status(400).json({ 
                status: "error", 
                message: "لقد قمت بملء بياناتك الشخصية بالفعل" 
            });
        }

        // 2. التحقق من أن الإيميل غير مكرر في جدول بيانات الطلاب
        const emailExists = await StudentData.findOne({ email });
        if (emailExists) {
            return res.status(400).json({ 
                status: "error", 
                message: "هذا البريد الإلكتروني مستخدم بالفعل" 
            });
        }

        // 3. إنشاء وثيقة بيانات الطالب الجديدة وربطها بالـ User ID المستخرج من التوكن
        const newStudentData = new StudentData({
            firstName,
            secondName,
            thirdName,
            fourthName,
            birthDate,
            gender,
            address,
            phone,
            whatsapp,
            email,
            percentage,
            score,
            nationalIdImage, // هنا الفرونت إند هيبعت رابط الصورة بعد ما يرفعها على السيرفر أو السحابة
            certificateImage,
            parent,
            user: req.user.id // الربط السحري هنا
        });

        await newStudentData.save();

        res.status(201).json({
            status: "success",
            message: "تم حفظ بيانات الطالب الشخصية والأكاديمية بنجاح",
            data: {
                studentDataId: newStudentData._id
            }
        });

    } catch (error) {
        console.error("Fill Profile Error:", error);
        res.status(500).json({ status: "error", message: "internal server error" });
    }
};

// دالة إضافية للطالب عشان يقدر يشوف بروفايله اللي ملاه في أي وقت
export const getStudentProfile = async (req, res) => {
    try {
        const profile = await StudentData.findOne({ user: req.user.id }).populate("user", "name nationalID");
        if (!profile) {
            return res.status(404).json({ status: "error", message: "لم يتم ملء البيانات بعد" });
        }
        res.status(200).json({ status: "success", data: profile });
    } catch (error) {
        res.status(500).json({ status: "error", message: "internal server error" });
    }
};