const User = require("../models/user");
const bcrypt = require("bcrypt");

async function handleUserSignup(
    req,
    res
) {

    const {
        name,
        email,
        password,
    } = req.body;

    const existing =
        await User.findOne({
            email,
        });

    if (existing) {
        return res.status(409).json({
            error:
                "User already exists",
        });
    }

    const hashedPassword =
        await bcrypt.hash(
            password,
            10
        );

    await User.create({
        name,
        email,
        password:
            hashedPassword,
    });

    return res.json({
        message:
            "Signup Successful",
    });
}

module.exports = {
    handleUserSignup,
};