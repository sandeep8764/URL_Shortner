

const { validateToken } =
    require("../services/auth");

function restrictToLoggedInUserOnly(
    req,
    res,
    next
) {

    const token =
        req.headers.authorization;

    if (!token) {
        return res.status(401).json({
            error: "Login Required",
        });
    }

    try {

        const user =
            validateToken(token);

        req.user = user;

        next();

    } catch {

        return res.status(401).json({
            error: "Invalid Token",
        });
    }
}

module.exports = {
    restrictToLoggedInUserOnly,
};