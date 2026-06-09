import 'dotenv/config';
import crypto from "crypto";
import axios from "axios";
import { PAYMENT_METHODS } from "../config/constants.js"; 

const generateHash = (string) => crypto.createHash("sha256").update(string).digest("hex");

const handleRefNumPayment = async (order, cart) => {
    try {
        const merchantCode = process.env.FAWRY_MERCHANT_CODE;
        const secureKey = process.env.FAWRY_SECURE_KEY;
        const fawryMethod = "PAYATFAWRY"; 
        
        const formattedAmount = order.totalPrice.toFixed(2);
        const orderIdStr = order._id.toString();

        const signature = generateHash(
            `${merchantCode}${orderIdStr}${order.userSlug}${fawryMethod}${formattedAmount}${secureKey}`
        );

        const payload = {
            merchantCode,
            merchantRefNum: orderIdStr, 
            customerProfileId: order.userSlug,
            customerMobile: order.address.phone,
            chargeItems: cart.items.map(item => ({
                itemId: item.productSlug,
                description: item.productSlug, 
                price: item.price.toFixed(2),
                quantity: item.quantity
            })),
            amount: formattedAmount, 
            paymentMethod: fawryMethod,
            signature
        };

  
        const response = await axios.post(process.env.FAWRY_CHARGE_URL, payload);

        if (response.data?.statusCode === 200 || response.data?.referenceNumber) {
            return { 
                type: "REFERENCE_NUMBER", 
                fawryRefNumber: response.data.referenceNumber,
                message: "يرجى التوجه لأي كشك والدفع برقم فوري المرجعي"
            };
        }
        throw new Error(response.data?.statusDescription || "فشل توليد الرقم المرجعي لفوري");
        
    } catch (error) {
        console.error("Fawry RefNum Error Details:", error.response?.data || error.message);
        throw new Error(error.response?.data?.statusDescription || "فشل توليد الرقم المرجعي لفوري");
    }
};

export const processFawryPayment = async (method, order, cart) => {
    if (method === PAYMENT_METHODS.FAWRY) {     
        return await handleRefNumPayment(order, cart);
    } else {
        throw new Error("طريقة الدفع المطلوبة غير مدعومة، متاح فقط الدفع عبر كشك فوري");
    }
};