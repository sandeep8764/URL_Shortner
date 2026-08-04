const express = require("express");

const {
    handleUserSignup,
} = require("../controllers/user");

const router = express.Router();

router.post(
    "/signup",
    handleUserSignup
);

module.exports = router;