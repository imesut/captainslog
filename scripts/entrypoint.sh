#!/bin/sh
set -e

# Wait for MongoDB to be available
node ./scripts/waitForMongo.mjs

# Run migration
echo "Running MongoDB migration..."
npm run migrate:mongodb || {
  echo "Migration failed, continuing to start services";
}

# Start Tina/Hugo preview (dokploy style)
exec npm run start:dokploy
