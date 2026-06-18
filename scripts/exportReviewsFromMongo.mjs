import fs from 'fs/promises';
import path from 'path';
import { fetchReviewsFromMongo, closeMongoConnection } from './mongoClient.mjs';

const outputFile = path.resolve('reviews.json');

async function exportReviews() {
  const reviews = await fetchReviewsFromMongo();
  await fs.writeFile(outputFile, JSON.stringify(reviews, null, 2), 'utf8');
  console.log(`Exported ${reviews.length} reviews from MongoDB to ${outputFile}`);
  await closeMongoConnection();
}

exportReviews().catch((error) => {
  console.error('Export failed:', error);
  process.exit(1);
});
