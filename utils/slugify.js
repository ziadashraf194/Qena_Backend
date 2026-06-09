import slugify from "slugify";

const generateRandomString = (length) => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789$-_.*";
    let result = "";
    
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters.charAt(randomIndex);
    }
    
    return result;
};

export const createSlug = (text) => {
    const randomMix = generateRandomString(6); 
    
    if (!text) return randomMix;

    const cleanSlug = slugify(text, {
        lower: true,      
        strict: true,     
        trim: true,       
        replacement: '-',
        locale: 'ar',
    });

    return `${cleanSlug}-${randomMix}`;
};