import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchReviewsFromMongo, fetchReviewBySlug, closeMongoConnection } from './scripts/mongoClient.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const publicPath = path.join(__dirname, 'public');
const port = Number(process.env.PORT || 8080);

app.use(express.json());
app.use(express.static(publicPath, { index: 'index.html' }));

app.get('/api/reviews', async (req, res) => {
  try {
    const reviews = await fetchReviewsFromMongo();
    res.json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to fetch reviews from MongoDB.' });
  }
});

app.get('/api/reviews/:slug', async (req, res) => {
  try {
    const review = await fetchReviewBySlug(req.params.slug);
    if (!review) {
      return res.status(404).json({ error: 'Review not found.' });
    }
    res.json(review);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to fetch review from MongoDB.' });
  }
});

app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', environment: process.env.NODE_ENV || 'production' });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server started on http://0.0.0.0:${port}`);
});
