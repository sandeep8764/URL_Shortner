const express = require("express");

const {
    handleGenerateShortURL,
    handleGetAnalytics,
    handleGetQRCode,
} = require("../controllers/url");

const router = express.Router();
const {
    restrictToLoggedInUserOnly,
} = require("../middlewares/auth");

router.post("/quick", handleGenerateShortURL);
router.post("/", restrictToLoggedInUserOnly, handleGenerateShortURL);
router.get("/analytics/:shortId", handleGetAnalytics);
router.get("/qr/:shortId", handleGetQRCode);

module.exports = router;