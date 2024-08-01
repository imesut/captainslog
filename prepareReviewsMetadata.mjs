import fs from 'fs'
import matter from 'gray-matter'
import path from 'path'

const contentDir = 'content/review/'
const outputFileName = "reviews.json"

console.log("Processing Review files...\n")

function processReviewFiles(dir) {
  const files = fs.readdirSync(dir)
  const result = []

  files.forEach((file) => {
    const filePath = path.join(dir, file)
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const parsedContent = matter(fileContent)
    
    result.push({
      ...parsedContent.data,
      // content: parsedContent.content
    })
  })

  return result;
}

const reviewsContent = processReviewFiles(contentDir)

const filtered = reviewsContent.filter(obj => obj.SpinoffCode !== undefined)

fs.writeFileSync(outputFileName, JSON.stringify(filtered, null, 4))

console.log(`${filtered.length} review processed. \nSaved to file: ${outputFileName}\n`)