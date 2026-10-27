require('dotenv').config();

const express = require('express');
const path = require('path');
const { connectMongoDB } = require('./connection');
const URL = require('./models/url');
const staticRouter = require('./routes/staticRouter');
const userRouter = require('./routes/user');
const urlRouter = require('./routes/url');

const app = express();
const PORT = Number(process.env.PORT || 8000);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', staticRouter);
app.use('/user', userRouter);
app.use('/url', urlRouter);
app.use(express.static(path.join(__dirname, 'public')));

app.get('/:shortId', async (req, res) => {
  try {
    const { shortId } = req.params;
    const entry = await URL.findOne({ shortId });

    if (!entry) {
      return res.status(404).send('URL not found');
    }

    const now = Date.now();
    entry.visitHistory.push({ timestamp: now });
    await entry.save();

    return res.redirect(entry.redirectURL);
  } catch (error) {
    console.error('Redirect error:', error);
    return res.status(500).send('Unable to redirect');
  }
});

app.use((req, res) => {
  res.status(404).send('Not Found');
});

connectMongoDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`URL shortener running at http://localhost:${PORT}`);
      console.log('Connected to MongoDB successfully');
    });
  })
  .catch((error) => {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  });
