const mongoose = require("mongoose");

const urlSchema = new mongoose.Schema({
    shortId: {
        type: String,
        required: true,
        unique: true,
    },
    redirectURL: {
        type: String,
        required: true,
    },
    expiresAt:{
        type:Date,
        
    },
    qrCode:{
        type:String,
        
    },
    visitHistory: [
        {
            timestamp: {
                type: Number,
            },
        },
    ],
});

module.exports = mongoose.model(
    "URL",
    urlSchema
);