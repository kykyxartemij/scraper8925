const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config()

async function fetchComic(comicNumber) {
  try {
    const response = await axios.get(`${process.env.ENDPOINT}/${comicNumber}/`);
    const $ = cheerio.load(response.data);
    const $comicImg = $('#comic img');
    const comicImageUrl = $comicImg.attr('src');
    const comicTitle = $comicImg.attr('title');

    return { imageUrl: comicImageUrl, title: comicTitle };
  } catch (error) {
    console.error(`Error fetching comic ${comicNumber}:`, error);
    return null;
  }
}

function sanitizeFilename(title) {
  return title.replace(/[^\w\s]/gi, '_'); 
}

async function downloadImage(url, title) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const sanitizedTitle = sanitizeFilename(title);
    const imagePath = path.join(__dirname, 'downloads', `${sanitizedTitle}.png`);
    await fs.mkdir(path.dirname(imagePath), { recursive: true });
    await fs.writeFile(imagePath, response.data);
    return imagePath;
  } catch (error) {
    console.error('Error downloading image:', error);
    return null;
  }
}

async function scrapeAndDownloadComics() {
  let comicNumber = 1;
  while (true) {
    const comic = await fetchComic(comicNumber);
    if (comic && comic.imageUrl) {
      const imagePath = await downloadImage(comic.imageUrl, comic.title);
      if (imagePath) {
        console.log(`Comic ${comicNumber} downloaded:`, imagePath);
      } else {
        console.log(`Failed to download comic ${comicNumber}.`);
      }
    } else {
      console.log(`Comic ${comicNumber} not found.`);
    }
    comicNumber++;
  }
}

scrapeAndDownloadComics();
