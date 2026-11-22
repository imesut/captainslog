import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

const episodePhotosPath = 'static/episodeImages/';
const OMDB_API_URL = 'https://www.omdbapi.com/';

const API_KEY = process.env.OMDB_API_KEY;

if (!API_KEY) {
    throw new Error('OMDB_API_KEY environment variable is missing!');
}

function getMetadata() {
    const fileContent = fs.readFileSync('reviews.json', {
        encoding: 'utf-8'
    });

    const jsonContent = JSON.parse(fileContent);

    return jsonContent.map(({
        SpinoffCode,
        Episode,
        Season,
        imdb
    }) => ({
        SpinoffCode,
        Episode,
        Season,
        imdb
    }));
}

const getLocalPath = (episodeCode) => {
    return path.join(episodePhotosPath, episodeCode + '.jpg');
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function getImdbImage(imdb, episodeCode) {
    try {
        // IMDb URL içerisinden ID çıkar
        const imdbId = imdb?.match(/tt\d+/)?.[0];

        if (!imdbId) {
            throw new Error(`Invalid IMDb ID: ${imdb}`);
        }

        console.log(`Fetching OMDb data: ${imdbId}`);

        // OMDb API isteği
        const apiUrl = new URL(OMDB_API_URL);

        apiUrl.searchParams.set('i', imdbId);
        apiUrl.searchParams.set('apikey', API_KEY);

        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`OMDb HTTP error: ${response.status}`);
        }

        const data = await response.json();

        if (data.Response === 'False') {
            throw new Error(`OMDb: ${data.Error}`);
        }

        const imageUrl = data.Poster;

        if (!imageUrl || imageUrl === 'N/A') {
            throw new Error(`Poster not found for ${imdbId}`);
        }

        console.log(`Image URL: ${imageUrl}`);

        // Görseli indir
        const imageResponse = await fetch(imageUrl);

        if (!imageResponse.ok) {
            throw new Error(`Image download failed: ${imageResponse.status}`);
        }

        const contentType = imageResponse.headers.get('content-type');

        if (!contentType?.startsWith('image/')) {
            throw new Error(`Invalid image content type: ${contentType}`);
        }

        const destination = path.resolve(
            episodePhotosPath,
            episodeCode + '.jpg'
        );

        await pipeline(
            Readable.fromWeb(imageResponse.body),
            fs.createWriteStream(destination, { flags: 'wx' })
        );

        console.log(`💾 Image saved for: ${episodeCode}\n`);

    } catch (error) {
        console.error(`❌ ${episodeCode}: ${error.message}\n`);
    }
}

// Main
async function main() {
    fs.mkdirSync(episodePhotosPath, { recursive: true });

    const data = getMetadata();

    console.log(`Analyzing ${data.length} episode reviews...\n`);

    for (const review of data) {
        const spinoff = review.SpinoffCode;
        const seasonNo = review.Season;
        const episodeNo = review.Episode;
        const imdbLink = review.imdb;

        const episodeCode = spinoff + '-' +
            ('0' + seasonNo).slice(-2) +
            ('0' + episodeNo).slice(-2);

        const pathForImage = getLocalPath(episodeCode);

        if (fs.existsSync(pathForImage)) {
            console.log(`✅ ${episodeCode}: image exists, skipping`);
            continue;
        }

        console.log(`🛜 Fetching image for: ${episodeCode}`);

        await getImdbImage(imdbLink, episodeCode);

        // API istekleri arasında 1 saniye bekle
        await delay(1000);
    }

    console.log('\n🏁 All downloads completed!');
}

main().catch(error => {
    console.error('Fatal error:', error);
    process.exitCode = 1;
});
