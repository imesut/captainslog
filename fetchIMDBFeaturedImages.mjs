import fs from 'fs'
import * as cheerio from 'cheerio';

let episodePhotosPath = "static/episodeImages/"

const myHeaders = new Headers();
myHeaders.append("Content-Type", "application/json");

const graphql = JSON.stringify({
  query: `
  {
    reviewConnection {
      edges {
        node {
          SpinoffCode,
          Episode,
          Season,
          imdb
        }
      }
    }
  }  
  `,
  variables: {}
})
const requestOptions = {
  method: "POST",
  headers: myHeaders,
  body: graphql,
  redirect: "follow"
};

let getLocalPath = (episodeCode) => {
  return episodePhotosPath + episodeCode + ".jpg"
}

import path from "path"
import stream, { Readable } from 'stream'
import {finished} from 'stream/promises'

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
    console.log(episodeCode, "image saved")
  })
}


fetch("http://localhost:4001/graphql", requestOptions)
  .then((response) => response.json())
  .then((result) => {
    let data = result.data.reviewConnection.edges.filter(e => e.node != null)
    
    console.log("Analyzing", data.length, "episode reviews.")
    console.log()

    data.forEach(r => {
        let review = r.node
        let spinoff = review["SpinoffCode"]
        let seasonNo = review["Season"]
        let episodeNo = review["Episode"]
        let imdbLink = review["imdb"]
        let episodeCode = spinoff + "-" + ("0" + seasonNo).slice(-2) + ("0" + episodeNo).slice(-2)

        let pathForImage = getLocalPath(episodeCode)

        if(fs.existsSync(pathForImage)){
          console.log()
          console.log(episodeCode, "image exist, will not fetch image")
          console.log()
        } else {
          getImdbImage(imdbLink, episodeCode)
        }

    });
  })
  .catch((error) => console.error(error));



