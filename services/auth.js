const jwt = require("jsonwebtoken");

const SECRET =
    process.env.JWT_SECRET || "change-this-secret";

function createToken(user) {

    return jwt.sign(
        {
            _id: user._id,
            email: user.email,
        },
        SECRET
    );
}

function validateToken(token) {

    return jwt.verify(
        token,
        SECRET
    );
}

module.exports = {
    createToken,
    validateToken,
};