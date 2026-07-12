import Application from "../models/Application.js";
import StudentData from "../models/StudentData.js";
import Faculty from "../models/Faculty.js";

// 1. إنشاء طلب تقديم جديد للكلية (متاح للطالب)
export const createApplication = async (req, res) => {
    try {
        const { facultyId } = req.body;

        // جلب بيانات الطالب الشخصية للتأكد من وجودها
        const studentData = await StudentData.findOne({ user: req.user.id });
        if (!studentData) {
            return res.status(400).json({ 
                status: "error", 
                message: "برجاء ملء استمارتك الشخصية والأكاديمية أولاً قبل التقديم" 
            });
        }

        // البحث عن أي طلبات تقديم سابقة قام بها هذا الطالب
        const existingApps = await Application.find({ studentDataId: studentData._id });

        // التحقق هل قدم الطالب على "نفس هذه الكلية" من قبل لمنع التكرار
        const isAlreadyAppliedToThisFaculty = existingApps.some(app => 
            app.facultyId.equals(facultyId)
        );

        if (isAlreadyAppliedToThisFaculty) {
            return res.status(400).json({ 
                status: "error", 
                message: "لقد قمت بالتقديم على هذه الكلية بالفعل، يمكنك اختيار كلية أخرى مختلفة" 
            });
        }

        // جلب بيانات الكلية ومطابقة التنسيق
        const faculty = await Faculty.findById(facultyId);
        if (!faculty) {
            return res.status(404).json({ status: "error", message: "الكلية المختارة غير موجودة" });
        }

        if (studentData.percentage < faculty.minPercentage) {
            return res.status(400).json({ 
                status: "error", 
                message: `مجموعك الحالي (${studentData.percentage}%) أقل من الحد الأدنى للقبول بهذه الكلية (${faculty.minPercentage}%)` 
            });
        }

        // إنشاء طلب التقديم للكلية الجديدة بحالة UNPAID و PENDING للـ Admin
        const newApplication = new Application({
            studentDataId: studentData._id,
            facultyId: faculty._id,
            paymentStatus: "UNPAID",
            adminStatus: "PENDING"
        });

        await newApplication.save();

        res.status(201).json({
            status: "success",
            message: `تم تسجيل طلب التقديم لـ (${faculty.name}) بنجاح. برجاء الانتقال لخطوة الدفع لتأكيد الطلب.`,
            data: {
                applicationId: newApplication._id,
                facultyName: faculty.name,
                amountToPay: faculty.applicationFee
            }
        });

    } catch (error) {
        console.error("Create Application Error:", error);
        res.status(500).json({ status: "error", message: "internal server error" });
    }
};

// 2. جلب كل طلبات التقديم الخاصة بالطالب الحالي
export const getMyApplications = async (req, res) => {
    try {
        const studentData = await StudentData.findOne({ user: req.user.id });
        if (!studentData) {
            return res.status(404).json({ status: "error", message: "لم يتم العثور على بياناتك الشخصية" });
        }

        const applications = await Application.find({ studentDataId: studentData._id })
            .populate("facultyId")
            .sort("-createdAt");

        res.status(200).json({
            status: "success",
            results: applications.length,
            data: applications
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: "internal server error" });
    }
};

// 3. جلب وتصفية كل الطلبات (للأدمن فقط)
export const getAllApplicationsForAdmin = async (req, res) => {
    try {
        const { 
            facultyId, 
            paymentStatus, 
            adminStatus, 
            minPercentage, 
            maxPercentage, 
            searchName,
            page = 1,      // الصفحة الافتراضية الأولى
            limit = 10     // العدد الافتراضي للعناصر في الصفحة الواحدة
        } = req.query;

        let queryFilter = {};

        // 1. فلاتر الـ Application الأساسية
        if (facultyId) queryFilter.facultyId = facultyId;
        if (paymentStatus) queryFilter.paymentStatus = paymentStatus;
        if (adminStatus) queryFilter.adminStatus = adminStatus;

        // 2. بناء فلاتر بيانات الطالب (StudentData)
        let studentFilter = {};
        if (minPercentage || maxPercentage) {
            studentFilter.percentage = {};
            if (minPercentage) studentFilter.percentage.$gte = parseFloat(minPercentage);
            if (maxPercentage) studentFilter.percentage.$lte = parseFloat(maxPercentage);
        }

        if (searchName) {
            studentFilter.$or = [
                { firstName: { $regex: searchName, $options: "i" } },
                { lastName: { $regex: searchName, $options: "i" } }
            ];
        }

        // إذا وُجدت فلاتر تخص الطالب، نجلب الـ IDs أولاً
        if (Object.keys(studentFilter).length > 0) {
            const matchedStudents = await StudentData.find(studentFilter).select("_id");
            const studentIds = matchedStudents.map(student => student._id);
            queryFilter.studentDataId = { $in: studentIds };
        }

        // 3. حسابات الـ Pagination
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;

        // 4. جلب إجمالي عدد الوثائق المطابقة للفلاتر (لإرسالها للفرونت إند لحساب الصفحات)
        const totalApplications = await Application.countDocuments(queryFilter);

        // 5. تنفيذ الاستعلام مع Skip و Limit والـ Populate
        const applications = await Application.find(queryFilter)
            .populate("studentDataId")
            .populate("facultyId")
            .sort("-createdAt") // الأحدث أولاً
            .skip(skip)
            .limit(limitNum);

        // 6. حساب إجمالي عدد الصفحات المتاحة بناءً على الليميت
        const totalPages = Math.ceil(totalApplications / limitNum);

        res.status(200).json({
            status: "success",
            pagination: {
                totalResults: totalApplications,
                totalPages: totalPages,
                currentPage: pageNum,
                limit: limitNum,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1
            },
            data: applications
        });
    } catch (error) {
        console.error("Admin Get Applications Error:", error);
        res.status(500).json({ status: "error", message: "internal server error" });
    }
};

export const updateApplicationStatus = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const { adminStatus, massage } = req.body; // الأدمن يرسل الحالة والرسالة معاً

        if (!["ACCEPTED", "REJECTED", "PENDING"].includes(adminStatus)) {
            return res.status(400).json({ status: "error", message: "حالة الطلب غير صالحة" });
        }
         console.log(applicationId);
        const application = await Application.findById(applicationId);
        if (!application) {
            return res.status(404).json({ status: "error", message: "طلب التقديم غير موجود" });
        }

        // الحماية: لا يمكن قبول الطلب إدارياً قبل الدفع
        if (adminStatus === "ACCEPTED" && application.paymentStatus !== "PAID") {
            return res.status(400).json({ 
                status: "error", 
                message: "لا يمكن قبول الطلب إدارياً قبل أن يقوم الطالب بسداد رسوم التقديم أولاً" 
            });
        }

        // تحديث الحالة والرسالة الموجهة للطالب
        application.adminStatus = adminStatus;
        if (massage) {
            application.massage = massage; // حفظ الرسالة مثل: "يرجى الحضور يوم الأحد ومعه أصل شهادة الثانوية"
        }

        await application.save();

        res.status(200).json({
            status: "success",
            message: `تم تحديث حالة الطلب بنجاح إلى ${adminStatus}`,
            data: application
        });

    } catch (error) {
        console.error("Update Application Status Error:", error);
        res.status(500).json({ status: "error", message: "internal server error" });
    }
};