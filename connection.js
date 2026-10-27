const mongoose = require("mongoose");

async function connectMongoDB(
    uri = process.env.MONGO_URI || process.env.MONGODB_URI
) {
    const mongoURI = uri || "mongodb://127.0.0.1:27017/url-shortener";
    return mongoose.connect(mongoURI);
}

module.exports = {
    connectMongoDB,
};