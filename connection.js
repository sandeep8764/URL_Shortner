const mongoose = require("mongoose");

async function connectMongoDB(uri = process.env.MONGO_URI) {
    return mongoose.connect(
        uri || "mongodb://127.0.0.1:27017/url-shortener"
    );
}

module.exports = {
    connectMongoDB,
};