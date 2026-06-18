import { getMongoClient } from './mongoClient.mjs';

const maxRetries = parseInt(process.env.MONGO_WAIT_RETRIES || '30', 10);
const delayMs = parseInt(process.env.MONGO_WAIT_DELAY_MS || '2000', 10);

async function wait() {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      const client = await getMongoClient();
      if (client) {
        console.log('Connected to MongoDB');
        return true;
      }
    } catch (err) {
      process.stdout.write('.');
    }
    attempt++;
    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error('Timed out waiting for MongoDB');
}

wait().catch((err) => {
  console.error(err);
  process.exit(1);
});
