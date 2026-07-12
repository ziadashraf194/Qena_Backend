import crypto from "crypto";
import axios from "axios";

/**
 * دالة مستقلة لعمل طلب دفع بكود فوري
 * @param {Object} data - بيانات الطالب والطلب والأكواد السرية
 */
export const createFawryRefNumberPayment = async (data) => {
    try {
        const {
            merchantCode,
            secureKey,
            merchantRefNum,
            customerProfileId,
            customerName,
            customerMobile,
            customerEmail,
            amount,
            description
        } = data;

        // 1. تحويل المبلغ لصيغة كسر عشري برقمين (مثال: 500.00) لأن فوري تشترط ذلك في الـ Signature والـ Body
        const formattedAmount = Number(amount).toFixed(2);
        const paymentMethod = "PayAtFawry";

        // 2. بناء السلسلة النصية وحساب الـ Signature (SHA-256) بناءً على توثيق فوري
        const rawSignatureString = `${merchantCode}${merchantRefNum}${customerProfileId}${paymentMethod}${formattedAmount}${secureKey}`;
        const signature = crypto.createHash("sha256").update(rawSignatureString).digest("hex");

        // 3. تجهيز الـ Payload بالكامل طبقاً لـ Sample Request الخاص بفوري
        const paymentPayload = {
            merchantCode,
            merchantRefNum,
            customerProfileId,
            customerName,
            customerMobile,
            customerEmail,
            amount: formattedAmount,
            paymentMethod,
            description,
            currencyCode: "EGP",
            language: "ar-eg", // لجعل رسائل فوري للطالب باللغة العربية
            chargeItems: [
                {
                    itemId: `FEE_${merchantRefNum}`,
                    description: description,
                    price: formattedAmount,
                    quantity: "1"
                }
            ],
            signature
        };

        // 4. إرسال الطلب إلى سيرفر Staging الخاص بفوري
        const response = await axios.post(
            "https://atfawry.fawrystaging.com/ECommerceWeb/Fawry/payments/charge",
            paymentPayload
        );

        // إرجاع البيانات المرتجعة من سيرفر فوري مباشرة
        return response.data;

    } catch (error) {
        console.error("Fawry Service Error:", error.response?.data || error.message);
        throw new Error(error.response?.data?.statusDescription || "Fawry API Request Failed");
    }
};