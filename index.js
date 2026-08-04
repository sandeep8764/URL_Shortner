const express = require("express"); // Import Express Library
const { connectMongoDB } = require("./connection"); // Connect 
const path=require("path");// Server side Renderning



const app = express();
// SSR

app.set("view engine", "ejs");

app.set(
    "views",
    path.resolve("./views")
);


connectMongoDB().then(() => console.log("MongoDB Connected"));

const urlRoute = require("./routes/url");
const URL = require("./models/url");

const staticRouter = require(
    "./routes/staticRouter"
);
// Now Connect the User part 

const userRoute=require("./routes/user");


app.use(express.json());

app.use(
    express.urlencoded({
        extended: false,
    })
);

app.use(express.static("public")); // for Image Qr ocde


app.use("/url", urlRoute); // urlRoute
app.use(
    "/user",
    userRoute
);// userRoute


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

    res.redirect(entry.redirectURL);
});

app.use("/", staticRouter);

app.listen(8000, () => {
    console.log("Server Started");
});