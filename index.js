require("dotenv").config();

const express = require("express");
const path = require("path");
const { connectMongoDB } = require("./connection");

const app = express();
const PORT = process.env.PORT || 8000;

app.set("view engine", "ejs");
app.set("views", path.resolve(__dirname, "views"));

connectMongoDB()
    .then(() => console.log("MongoDB Connected"))
    .catch((error) => {
        console.error("MongoDB connection failed:", error.message);
    });

const urlRoute = require("./routes/url");
const URL = require("./models/url");
const staticRouter = require("./routes/staticRouter");
const userRoute = require("./routes/user");

app.use(express.json());
app.use(
    express.urlencoded({
        extended: false,
    })
);

app.use(express.static(path.join(__dirname, "public")));

app.use("/url", urlRoute);
app.use("/user", userRoute);

app.get("/:shortId", async (req, res) => {
    const shortId = req.params.shortId;

    const entry = await URL.findOneAndUpdate(
        {
            shortId,
        },
        {
            $push: {
                visitHistory: {
                    timestamp: Date.now(),
                },
            },
        }
    );

    if (!entry) {
        return res.status(404).send("Short URL Not Found");
    }

    return res.redirect(entry.redirectURL);
});

app.use("/", staticRouter);

app.listen(PORT, () => {
    console.log(`Server Started on port ${PORT}`);
});