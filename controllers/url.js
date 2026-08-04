const shortid = require("shortid");
const URL = require("../models/url");
const validator=require("validator");

const QRCode = require("qrcode");
const path = require("path");



async function handleGenerateShortURL(
    req,
    res
) {
    const body = req.body;

    if (!body.url) {
    return res.status(400).json({
        error: "URL Required",
    });
}
        // Validator codes That Actaully Validate the URL
        
        if (!validator.isURL(body.url)) {
    return res.status(400).json({
        error: "Please enter a valid URL",
    });
}

    const shortID =
    body.customAlias || shortid();
    
    
    const existing = await URL.findOne({
    shortId: shortID,
    
    


});
 // This part ids for Qrcodes 
 


    const shortURL = `http://localhost:8000/${shortID}`;
    if (existing) {
    return res.status(409).json({
        error: "Alias already exists",
    });
}

    //const qrCodeImage = await QRCode.toDataURL(shortURL);
    // Replaced with 
    
    const qrFilePath = path.join(
    __dirname,
    "../public/qrcodes",
    `${shortID}.png`
);
console.log("QR Path:", qrFilePath);
await QRCode.toFile(
    qrFilePath,
    shortURL
);



let expiresAt = null;

if (body.expiryInDays) {
    expiresAt = new Date();

    expiresAt.setDate(
        expiresAt.getDate() + Number(body.expiryInDays)
    );
}

    await URL.create({
        shortId: shortID,
        redirectURL: body.url,
        expiresAt:expiresAt,
        //qrCode:qrCodeImage,
        qrCode: `/qrcodes/${shortID}.png`,
        visitHistory: [],
    });

    return res.json({
        id: shortID,
        shortURL,
        //qrCode:qrCodeImage,
        qrCode: `http://localhost:8001/qrcodes/${shortID}.png`,
        
    });
}


// This part is for Handle(counts+click)
async function handleGetAnalytics(req, res) {

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


// This Part is for QRCODES 
async function handleGetQRCode(req, res) {
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