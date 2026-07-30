import { Jimp } from "jimp";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function findCircle() {
  const logoPath = path.join(__dirname, 'public', 'logo.jpg');
  const image = await Jimp.read(logoPath);
  
  const w = image.bitmap.width;
  const h = image.bitmap.height;
  const cy = Math.floor(h/2);
  
  // Scan from left to right at center Y to find where it stops being white
  let startX = 0;
  for (let x = 0; x < w/2; x++) {
    const hex = image.getPixelColor(x, cy);
    const r = (hex >> 24) & 255;
    const g = (hex >> 16) & 255;
    const b = (hex >> 8) & 255;
    if (r < 240 || g < 240 || b < 240) {
      startX = x;
      break;
    }
  }
  
  console.log(`Non-white starts at X: ${startX}`);
  console.log(`Circle radius is approximately: ${w/2 - startX}`);
}

findCircle();
