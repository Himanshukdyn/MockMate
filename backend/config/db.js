import mongoose from 'mongoose'

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI)
        console.log(`MongoDB Connected: ${conn.connection.host}`)
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        // Removed process.exit(1) so Render has time to print the log
    }
}

export default connectDB