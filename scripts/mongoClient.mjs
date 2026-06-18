import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || 'captainslog';
const MONGO_COLLECTION_NAME = process.env.MONGO_COLLECTION_NAME || 'reviews';

let cachedClient = null;

export async function getMongoClient() {
  if (cachedClient) {
    return cachedClient;
  }

  cachedClient = new MongoClient(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  await cachedClient.connect();
  return cachedClient;
}

export async function getDb() {
  return (await getMongoClient()).db(MONGO_DB_NAME);
}

export async function getReviewCollection() {
  return (await getDb()).collection(MONGO_COLLECTION_NAME);
}

export async function closeMongoConnection() {
  if (!cachedClient) {
    return;
  }

  await cachedClient.close();
  cachedClient = null;
}

export function normalizeReviewDoc(doc) {
  if (!doc) {
    return null;
  }

  const { _id, ...rest } = doc;
  return {
    ...rest,
    _id: _id?.toString?.() || null,
  };
}

export async function fetchReviewsFromMongo() {
  const collection = await getReviewCollection();
  const docs = await collection.find({}).sort({ SpinoffCode: 1, Season: 1, Episode: 1 }).toArray();
  return docs.map(normalizeReviewDoc);
}

export async function fetchReviewBySlug(slug) {
  if (!slug) {
    return null;
  }

  const collection = await getReviewCollection();
  const doc = await collection.findOne({ slug });
  return normalizeReviewDoc(doc);
}
