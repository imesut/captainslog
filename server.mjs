import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { marked } from 'marked';
import { fetchReviewsFromMongo, fetchReviewBySlug, closeMongoConnection } from './scripts/mongoClient.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const publicPath = path.join(__dirname, 'public');
const port = Number(process.env.PORT || 8080);

app.use(express.json());
app.use(express.static(publicPath, { index: 'index.html' }));

// determine a stylesheet to include (pick first compiled stylesheet in public/assets/css)
let cssHref = '/assets/css/stylesheet.css';
(async () => {
  try {
    const cssDir = path.join(publicPath, 'assets', 'css');
    const files = await fs.readdir(cssDir);
    const sheet = files.find((f) => f.endsWith('.css'));
    if (sheet) cssHref = '/assets/css/' + sheet;
  } catch (e) {
    // ignore - fallback will be used
  }
})();

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

// Serve review pages dynamically from Mongo instead of static markdown files
app.get(['/review/:slug', '/review/:slug/'], async (req, res, next) => {
  try {
    const slug = req.params.slug;
    const review = await fetchReviewBySlug(slug);
    if (!review) return next();

    const bodyHtml = marked.parse(review.body || '');

    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(review.Title || 'Review')}</title>
  <link rel="stylesheet" href="${cssHref}">
</head>
<body>
  <main class="content">
    <article>
      <h1>${escapeHtml(review.Title || '')}</h1>
      <p><strong>Episode:</strong> ${escapeHtml(String(review.SpinoffCode || ''))} ${escapeHtml(String(review.Season || ''))}-${escapeHtml(String(review.Episode || ''))}</p>
      ${review.cover && review.cover.image ? `<img src="${escapeHtml(review.cover.image)}" alt="${escapeHtml(review.cover.alt || '')}">` : ''}
      <div class="review-body">${bodyHtml}</div>
    </article>
  </main>
</body>
</html>`;

    res.send(html);
  } catch (err) {
    console.error(err);
    next(err);
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

app.listen(port, () => {
  console.log(`Server started on http://0.0.0.0:${port}`);
});
