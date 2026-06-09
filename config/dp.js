import mongoose from "mongoose";

async function connectDB(){
    try{
        await mongoose.connect(process.env.MONGO_URL);
        console.log('MongoDB connected');
    }catch(err){
        console.log(err);
    }
}

export default connectDB;