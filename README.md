# URL Shortener

A simple URL shortener built with Node.js, Express, MongoDB, and QR code generation.

## Features

- Create short URLs
- Redirect short URLs to original destinations
- Track visit history
- Generate QR code for each short URL
- JWT-based auth middleware for URL creation
- MongoDB persistence

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local environment file:

   ```bash
   cp .env.example .env
   ```

3. Start the app:

   ```bash
   npm run dev
   ```

4. Open:

   ```bash
   http://localhost:8000
   ```

## Environment Variables

- `PORT`: port for the server
- `MONGO_URI`: MongoDB connection string
- `APP_URL`: full public URL of the deployed app, for example `https://my-app.onrender.com`
- `JWT_SECRET`: secret used for signing JWT tokens

## Deployment on Render

1. Create a new Web Service on Render.
2. Connect this repository.
3. Set the build command:

   ```bash
   npm install
   ```

4. Set the start command:

   ```bash
   npm start
   ```

5. Add environment variables:
   - `MONGO_URI` = your MongoDB Atlas URI
   - `APP_URL` = your Render URL
   - `JWT_SECRET` = a strong random secret
   - `PORT` = `10000` or the default Render-provided port if required

6. Deploy.

## Deployment on Railway, Heroku, or similar

Use the same environment variables and set:

```bash
npm start
```

Make sure your database is reachable from the host and your `APP_URL` matches the deployed public URL.

## Notes

- QR code images are saved under `public/qrcodes/`.
- The app expects a MongoDB instance to be available at runtime.
- For production, use a real MongoDB service such as MongoDB Atlas.

