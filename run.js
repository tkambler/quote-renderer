const quotes = require('./quotes');
const jimp = require('jimp');
const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

class SourceResolver {
    
    constructor() {
        this.images = glob.sync('*.jpg', {
            'cwd': path.resolve(__dirname, 'assets/backgrounds'),
            'absolute': true
        });
        this.index = 0;
    }
    
    getImage() {
        const res = this.images[this.index];
        this.index++;
        if (this.index > this.images.length - 1) {
            this.index = 0;
        }
        return res;
    }
    
}

const srcResolver = new SourceResolver();

const destDir = path.resolve(__dirname, 'output');

let font;
let overlay;
    
async function renderQuote({ quote, source }, idx) {
    
    console.log('Rendering quote:', `${quote} -- ${source}`);
    
    const src = await jimp.read(srcResolver.getImage());
    
    if (!overlay) {
        overlay = await jimp.read('./assets/overlay.jpg');
        overlay.opacity(0.4);
    }
    
    if (!font) {
        font = await jimp.loadFont(jimp.FONT_SANS_32_WHITE);
    }
    
    src.composite(overlay, 0, 0, {
        mode: jimp.BLEND_SOURCE_OVER,
        opacitySource: 1.0,
        opacityDest: 0.9
    });
    
    src.print(font, 25, 0, {
        text: `${quote} - ${source}`,
        alignmentX: jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: jimp.VERTICAL_ALIGN_MIDDLE
    }, 1316, 768);
    
    const destFile = path.resolve(destDir, `${idx}.jpg`);
    
    await src.write(destFile);
    
}

async function run() {
    
    fs.ensureDirSync(destDir);
    
    for (const idx in quotes) {
        const quote = quotes[idx];
        await renderQuote(quote, idx);
    }
    
}

run();