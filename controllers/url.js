const shortid = require("shortid");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const validator = require("validator");
const QRCode = require("qrcode");
const URL = require("../models/url");

function ensureDatabaseConnected() {
    if (mongoose.connection.readyState !== 1) {
        throw new Error("Database not connected");
    }
}

function getBaseURL(req) {
    if (process.env.APP_URL || process.env.BASE_URL) {
        return (process.env.APP_URL || process.env.BASE_URL).replace(/\/$/, "");
    }

    if (req && req.protocol && req.get) {
        return `${req.protocol}://${req.get("host")}`;
    }

    return `http://localhost:${process.env.PORT || 8000}`;
}

async function handleGenerateShortURL(req, res) {
    try {
        ensureDatabaseConnected();
    } catch (error) {
        return res.status(503).json({
            error: "Database unavailable. Please start MongoDB or configure MONGO_URI.",
        });
    }

    const body = req.body;

    if (!body.url) {
        return res.status(400).json({
            error: "URL Required",
        });
    }

    if (!validator.isURL(body.url)) {
        return res.status(400).json({
            error: "Please enter a valid URL",
        });
    }

    const shortID = body.customAlias || shortid();
    const existing = await URL.findOne({
        shortId: shortID,
    });

    if (existing) {
        return res.status(409).json({
            error: "Alias already exists",
        });
    }

    const baseURL = getBaseURL(req);
    const shortURL = `${baseURL}/${shortID}`;

    const qrDirectory = path.join(__dirname, "../public/qrcodes");
    fs.mkdirSync(qrDirectory, { recursive: true });

    const qrFilePath = path.join(qrDirectory, `${shortID}.png`);
    await QRCode.toFile(qrFilePath, shortURL);

    let expiresAt = null;

    if (body.expiryInDays) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + Number(body.expiryInDays));
    }

    await URL.create({
        shortId: shortID,
        redirectURL: body.url,
        expiresAt: expiresAt,
        qrCode: `/qrcodes/${shortID}.png`,
        visitHistory: [],
    });

    return res.json({
        id: shortID,
        shortURL,
        qrCode: `${baseURL}/qrcodes/${shortID}.png`,
    });
}

async function handleGetAnalytics(req, res) {
    try {
        ensureDatabaseConnected();
    } catch (error) {
        return res.status(503).json({
            error: "Database unavailable. Please start MongoDB or configure MONGO_URI.",
        });
    }

    const shortId = req.params.shortId;

    const result = await URL.findOne({
        shortId,
    });

    if (!result) {
        return res.status(404).json({
            error: "URL not found",
        });
    }

    return res.json({
        totalClicks: result.visitHistory.length,
        analytics: result.visitHistory,
    });
}

async function handleGetQRCode(req, res) {
    try {
        ensureDatabaseConnected();
    } catch (error) {
        return res.status(503).json({
            error: "Database unavailable. Please start MongoDB or configure MONGO_URI.",
        });
    }

    const shortId = req.params.shortId;

    const entry = await URL.findOne({
        shortId,
    });

    if (!entry) {
        return res.status(404).json({
            message: "URL not found",
        });
    }

    return res.send(`
    <h2>QR Code</h2>
    <img src="${entry.qrCode}" width="300"/>
`);
}

module.exports = {
    handleGenerateShortURL,
    handleGetAnalytics,
    handleGetQRCode,
};