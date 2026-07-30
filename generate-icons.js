import { Jimp, rgbaToInt } from "jimp";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function processLogo() {
  try {
    const logoPath = path.join(__dirname, 'public', 'logo.jpg');
    const image = await Jimp.read(logoPath);
    
    const w = image.bitmap.width;
    const h = image.bitmap.height;
    
    // Background color
    const bgColor = rgbaToInt(0xe1, 0xc3, 0xb9, 255);
    
    // Fill the outside just in case
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dx = x - w/2;
        const dy = y - h/2;
        const distSq = dx*dx + dy*dy;
        
        if (distSq > 380 * 380) {
           image.setPixelColor(bgColor, x, y);
        }
      }
    }
    
    // The user wants it ZOOMED IN heavily ("Zoom it, zoom it, zoom it")
    // Let's crop it aggressively to 600x600 out of 1024x1024!
    const cropSize = 600;
    const cropX = Math.floor((w - cropSize) / 2);
    const cropY = Math.floor((h - cropSize) / 2);
    image.crop({ x: cropX, y: cropY, w: cropSize, h: cropSize });
    
    // Make a 192x192 version
    const img192 = image.clone();
    img192.resize({ w: 192, h: 192 });
    await img192.write(path.join(__dirname, 'public', 'logo-192.png'));
    
    // Make a 512x512 version
    const img512 = image.clone();
    img512.resize({ w: 512, h: 512 });
    await img512.write(path.join(__dirname, 'public', 'logo-512.png'));
    
    await image.write(path.join(__dirname, 'public', 'logo-fixed.png'));
    
    console.log("Icons filled, zoomed HEAVILY, and generated successfully!");
  } catch (error) {
    console.error("Error generating icons:", error);
  }
}

processLogo();
