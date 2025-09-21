// Select A Random Unwatched Episode

import fs, { stat } from 'fs'

const reviewsPath = "content/review"
const jsonFileName = "allEpisodes.json"
const episodesCsvLink = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSto91mm4BRRpvfF6fYDSKQD5tHAod9dcZzKEdUH0qlV8Uc1hxhmArDtsHMjPOcEeu3n20JaljDpEJV/pub?gid=0&single=true&output=csv"

const daysOfValidCache = 60

var allEpisodesList = []
var randomlySelectedEpisode = []

checkDataFile()
    .catch(status => { return renewDataFile() })
    .then(status => { return readAndMapData() })
    .then(status => {
        randomlySelectedEpisode = pickRandomAsFileName()
        
        while(doesItExist(randomlySelectedEpisode[0]) === true) {
            randomlySelectedEpisode = pickRandomAsFileName()
        }
        
        let _spinoff = randomlySelectedEpisode[1][1]
        let _season = randomlySelectedEpisode[1][4]
        let _episode = randomlySelectedEpisode[1][5]
        let _episodeName = randomlySelectedEpisode[1][2]

        console.log(`\n\n 🎦 Selected Episode is: \n Spinoff: ${_spinoff} \n Season: ${_season} \n Episode: ${_episode} \n Episode Name: ${_episodeName} \n `)
    })



function checkDataFile() {
    return new Promise((res, rej) => {
        if (fs.existsSync(jsonFileName)) {
            fs.stat(jsonFileName, (err, stats) => {
                if (err === null) {
                    const today = new Date()
                    const lastModifiedDate = new Date(stats.mtime)
                    const msDiff = today.getTime() - lastModifiedDate.getTime()
                    const dayDifference = Math.round(msDiff / (24 * 60 * 60 * 60))

                    if (dayDifference < daysOfValidCache) {
                        console.log("Data file is current")
                        res(true)
                    } else {
                        console.log(`Data file is older than ${daysOfValidCache} days.`)
                        rej(false)
                    }
                }
            })
        } else {
            rej(false)
        }
    })
}


function renewDataFile() {
    return new Promise((res, rej) => {

        console.log("Renewing data file.")

        fetch(episodesCsvLink)
            .then(response => response.text())
            .then(text => {
                let lines = text.split("\r\n")
                lines.forEach(line => {
                    let fields = line.split(",")
                    allEpisodesList.push(fields)
                });

                let episodesJsonObject = JSON.stringify(allEpisodesList)
                fs.writeFileSync(jsonFileName, episodesJsonObject)
                console.log("Data file saved.")
                res(true)
            })
    })

}


function readAndMapData() {
    return new Promise((res, rej) => {
        let reader = fs.readFileSync(jsonFileName, { encoding: "utf-8" })
        allEpisodesList = JSON.parse(reader)
        res(true)
    })
}

function pickRandomAsFileName() {
    let randomItem = allEpisodesList[Math.floor(Math.random() * allEpisodesList.length)]
    let spinoff = randomItem[1]
    let season = randomItem[4].padStart(2, '0')
    let episode = randomItem[5].padStart(2, '0')
    return [`${spinoff}-${season}${episode}.md`, randomItem]
}


function doesItExist(filename){
    return fs.existsSync(reviewsPath + filename)
}

