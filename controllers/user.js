const User = require("../models/user");
const bcrypt = require("bcrypt");
const { createToken } = require("../services/auth");

async function handleUserSignup(req, res) {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            error: "Name, email, and password are required",
        });
    }

    const existing = await User.findOne({ email });

    if (existing) {
        return res.status(409).json({
            error: "User already exists",
        });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
        name,
        email,
        password: hashedPassword,
    });

    return res.json({
        message: "Signup Successful",
    });
}

async function handleUserLogin(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            error: "Email and password are required",
        });
    }

    const user = await User.findOne({ email });

    if (!user) {
        return res.status(401).json({
            error: "Invalid email or password",
        });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        return res.status(401).json({
            error: "Invalid email or password",
        });
    }

    const token = createToken(user);

    return res.json({
        message: "Login Successful",
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
        },
    });
}

module.exports = {
    handleUserSignup,
    handleUserLogin,
};