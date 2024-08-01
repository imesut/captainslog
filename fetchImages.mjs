import fs from 'fs'
import * as cheerio from 'cheerio';
import path from "path"
import stream, { Readable } from 'stream'
import { finished } from 'stream/promises'

let episodePhotosPath = "static/episodeImages/"

function getMetadata() {
    let fileContent = fs.readFileSync("reviews.json", { encoding: "utf-8" })
    let jsonContent = JSON.parse(fileContent)
    
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
    }))
}


let getLocalPath = (episodeCode) => {
    return episodePhotosPath + episodeCode + ".jpg"
}

let getImdbImage = (imdb, episodeCode) => {
    console.log("Fetching imdb link:", imdb, "...");
    fetch(imdb)
        .then(response => response.text())
        .then(async (body) => {
            let $ = cheerio.load(body);
            let imageUrl = $('meta[property="og:image"]').attr('content') || $('meta[property="og:image:url"]').attr('content')
            let imgDownload = await fetch(imageUrl);
            let destination = path.resolve(episodePhotosPath, episodeCode + ".jpg");
            let fileStream = fs.createWriteStream(destination, { flags: 'wx' });
            await finished(Readable.fromWeb(imgDownload.body).pipe(fileStream));
            console.log(`💾 image saved for: ${episodeCode}\n`)
        })
}


let data = getMetadata()
console.log(`Analyzing ${data.length} episode reviews...\n`)

data.forEach(review => {
    let spinoff = review["SpinoffCode"]
    let seasonNo = review["Season"]
    let episodeNo = review["Episode"]
    let imdbLink = review["imdb"]

    let episodeCode = spinoff + "-" + ("0" + seasonNo).slice(-2) + ("0" + episodeNo).slice(-2)

    let pathForImage = getLocalPath(episodeCode)

    if (fs.existsSync(pathForImage)) {
        console.log(`✅ ${episodeCode} : image exist, will not fetch image`)
    } else {
        console.log(`🛜 Fetching image for: ${episodeCode}`)
        getImdbImage(imdbLink, episodeCode)
    }

})
