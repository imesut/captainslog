import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import { getReviewCollection, closeMongoConnection } from './mongoClient.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const contentDir = path.resolve(__dirname, '../content/review');
const ignoredFiles = new Set(['_index.md']);

function normalizeReviewData(fileName, parsed) {
  const data = parsed.data || {};
  const slug = path.basename(fileName, '.md');
  const body = parsed.content?.trim() ?? '';

  return {
    slug,
    filename: fileName,
    Date: data.Date instanceof Date ? data.Date : new Date(data.Date),
    SpinoffCode: data.SpinoffCode ?? null,
    EpisodeName: data.EpisodeName ?? null,
    Season: Number(data.Season ?? 0),
    Episode: Number(data.Episode ?? 0),
    StarTrekValues: Number(data.StarTrekValues ?? 0),
    Inspiring: Number(data.Inspiring ?? 0),
    StoryDevelopment: Number(data.StoryDevelopment ?? 0),
    OverallScore: Number(data.OverallScore ?? 0),
    imdb: data.imdb ?? null,
    Title: data.Title ?? slug,
    tags: Array.isArray(data.tags) ? data.tags : data.tags ? [data.tags] : [],
    cover: data.cover ?? null,
    body,
    importedAt: new Date(),
    updatedAt: new Date(),
  };
}

async function readReviewFiles(directory) {
  const fileNames = await fs.readdir(directory);
  const reviewFiles = fileNames.filter((file) => file.endsWith('.md') && !ignoredFiles.has(file));
  const reviews = [];

  for (const fileName of reviewFiles) {
    const filePath = path.join(directory, fileName);
    const fileContents = await fs.readFile(filePath, 'utf8');
    const parsed = matter(fileContents);
    reviews.push(normalizeReviewData(fileName, parsed));
  }

  return reviews;
}

async function migrate() {
  const reviews = await readReviewFiles(contentDir);
  const collection = await getReviewCollection();

  console.log(`Found ${reviews.length} review files to migrate.`);

  let upsertCount = 0;

  for (const review of reviews) {
    const result = await collection.updateOne(
      { slug: review.slug },
      { $set: review },
      { upsert: true }
    );
    if (result.upsertedCount === 1 || result.modifiedCount === 1) {
      upsertCount += 1;
    }
  }

  console.log(`Migrated ${upsertCount}/${reviews.length} reviews to MongoDB.`);
  await closeMongoConnection();
}

migrate().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
