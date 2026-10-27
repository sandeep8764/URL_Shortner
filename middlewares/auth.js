
const { validateToken } = require("../services/auth");

function extractTokenFromHeader(authHeader) {
    if (!authHeader) {
        return null;
    }

    const normalized = authHeader.trim();

    if (normalized.startsWith("Bearer ")) {
        return normalized.replace("Bearer ", "").trim();
    }

    return normalized;
}

function restrictToLoggedInUserOnly(req, res, next) {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
        return res.status(401).json({
            error: "Login Required",
        });
    }

    try {
        const user = validateToken(token);
        req.user = user;
        return next();
    } catch {
        return res.status(401).json({
            error: "Invalid Token",
        });
    }
}

module.exports = {
    restrictToLoggedInUserOnly,
    extractTokenFromHeader,
};