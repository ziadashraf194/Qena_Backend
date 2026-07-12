import Faculty from "../models/Faculty.js";

export const createFaculty = async (req, res) => {
    try {
        const { name, minPercentage, applicationFee } = req.body;

        const facultyExists = await Faculty.findOne({ name });
        if (facultyExists) {
            return res.status(400).json({ 
                status: "error", 
                message: "هذه الكلية مسجل بالفعل في النظام" 
            });
        }

        const newFaculty = new Faculty({
            name,
            minPercentage,
            applicationFee     
        });

        await newFaculty.save();

        res.status(201).json({
            status: "success",
            message: "تم إضافة الكلية بنجاح",
            data: newFaculty
        });

    } catch (error) {
        console.error("Create Faculty Error:", error);
        res.status(500).json({ status: "error", message: "internal server error" });
    }
};

export const getAllFaculties = async (req, res) => {
    try {
        const faculties = await Faculty.find({});
        res.status(200).json({
            status: "success",
            results: faculties.length,
            data: faculties
        });
    } catch (error) {
        console.error("Get Faculties Error:", error);
        res.status(500).json({ status: "error", message: "internal server error" });
    }
};