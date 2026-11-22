import chokidar from 'chokidar';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import { upsertReviewDoc, deleteReviewBySlug } from './mongoClient.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const contentDir = path.resolve(__dirname, '../content/review');

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
    updatedAt: new Date(),
  };
}

async function handleAddOrChange(filePath) {
  try {
    const fileName = path.basename(filePath);
    if (!fileName.endsWith('.md') || fileName === '_index.md') return;
    const contents = await fs.readFile(filePath, 'utf8');
    const parsed = matter(contents);
    const normalized = normalizeReviewData(fileName, parsed);
    await upsertReviewDoc(normalized);
    console.log('Synced to Mongo:', normalized.slug);
  } catch (err) {
    console.error('Sync failed for', filePath, err);
  }
}

async function handleUnlink(filePath) {
  try {
    const fileName = path.basename(filePath);
    const slug = path.basename(fileName, '.md');
    await deleteReviewBySlug(slug);
    console.log('Deleted from Mongo:', slug);
  } catch (err) {
    console.error('Delete failed for', filePath, err);
  }
}

console.log('Watching', contentDir);
const watcher = chokidar.watch(contentDir, { ignoreInitial: false, depth: 0 });

watcher.on('add', handleAddOrChange);
watcher.on('change', handleAddOrChange);
watcher.on('unlink', handleUnlink);

process.on('SIGINT', async () => {
  await watcher.close();
  process.exit(0);
});
