const quotes = require('../quotes');
// const quotes = require('../quotes').slice(0, 1);
const FontManager = require('./font-manager');
const jimp = require('jimp');
const fs = require('fs-extra');
const path = require('path');
const IMAGE_WIDTH = 1366;
const IMAGE_HEIGHT = 768;
const SourceResolver = require('./source-resolver');
const debug = require('debug')('quote-renderer');
const destDir = path.resolve(__dirname, '../output');
const ProgressBar = require('progress');
const ora = require('ora');
const progress = new ProgressBar(':bar ETA: :eta (seconds)', {
    total: quotes.length,
    width: 100
});
let bigFont;
let smallFont;
let middleFont;
let overlay;
let spinner;

class Renderer {
    
    constructor(options = {}) {
        this.options = options;
    }
    
    async init() {
        
        this.fonts = new FontManager({
            'path': this.options.font_path
        });
        
        await this.fonts.init();
        
        this.srcResolver = new SourceResolver();
        await this.srcResolver.init();
        
        overlay = await jimp.read(path.resolve(__dirname, '../assets/overlay.jpg'));
        overlay.opacity(0.4);
        
        fs.emptyDirSync(destDir);
        
    }
    
    getTextDimensions(text, size) {
        
        const dims = {};
    
        switch (size) {
            case 'big':
                dims.height = jimp.measureTextHeight(bigFont, text, 1055);
            break;
            case 'small':
                dims.height = jimp.measureTextHeight(smallFont, text, 1055);
            break;
            default:
                throw new Error('Unknown size: ' + size);
        }
        
        debug('textDimensions', {
            text,
            height: dims.height,
            size: size
        });
    
        return dims;
        
    }
    
    async render({ quote, source }, idx) {
        
        debug('Rendering quote:', `${quote} -- ${source}`);
    
        const src = await jimp.read(this.srcResolver.getImage());
    
        src.composite(overlay, 0, 0, {
            mode: jimp.BLEND_SOURCE_OVER,
            opacitySource: 1.0,
            opacityDest: 0.9
        });
    
        const quoteCoords = {};
        
        const quoteFont = await this.fonts.calculateFont(quote, 600, 1055);
        // console.log('quoteFont', quoteFont);
        
        const sourceFont = await this.fonts.calculateFont(source, 50, 1055);
        // console.log('sourceFont', sourceFont);
        
        // process.exit();
        
        const totalHeight = quoteFont.height + 50 + sourceFont.height;
        const topOffset = Math.floor((IMAGE_HEIGHT - totalHeight) / 2);
        
        src.print(quoteFont.font, 155, topOffset, {
            text: quote,
            alignmentX: jimp.HORIZONTAL_ALIGN_CENTER,
        }, 1055, 768, (err, img, {x, y}) => {
            quoteCoords.x = x;
            quoteCoords.y = y;
        });
        
        src.print(sourceFont.font, 155, quoteCoords.y + 50, {
            text: source,
            alignmentX: jimp.HORIZONTAL_ALIGN_CENTER,
        }, 1055);

        const destFile = path.resolve(destDir, `${idx}.jpg`);

        await src.writeAsync(destFile);

        progress.tick();

        
        // const smallDims = this.getTextDimensions(source, 'small');
        //
        // const totalHeight = bigDims.height + 50 + smallDims.height;
        // // const totalHeight = bigDims.height;
        // debug(totalHeight);
        // // const topOffset = IMAGE_HEIGHT - Math.floor(totalHeight / 2);
        // const topOffset = Math.floor(
        //     (IMAGE_HEIGHT - totalHeight) / 2
        // );
        // // debug('t', topOffset);
        // // process.exit();
        //
        // src.print(topFont, 155, topOffset, {
        //     text: quote,
        //     alignmentX: jimp.HORIZONTAL_ALIGN_CENTER,
        //     // alignmentY: jimp.VERTICAL_ALIGN_MIDDLE
        // }, 1055, 768, (err, img, {x, y}) => {
        //     quoteCoords.x = x;
        //     quoteCoords.y = y;
        // });
        //
        // src.print(smallFont, 155, quoteCoords.y + 50, {
        //     text: source,
        //     alignmentX: jimp.HORIZONTAL_ALIGN_CENTER,
        //     // alignmentY: jimp.VERTICAL_ALIGN_MIDDLE
        // }, 1055);
        //
        // const destFile = path.resolve(destDir, `${idx}.jpg`);
        //
        // await src.writeAsync(destFile);
        //
        // progress.tick();
        
    }
    
    async run() {
        
        await this.init();
        
        // console.log(jimp.FONT_SANS_64_WHITE);
        // process.exit();
    
        // bigFont = await jimp.loadFont(jimp.FONT_SANS_64_WHITE);
        // bigFont = await jimp.loadFont(path.resolve(__dirname, '../assets/fonts/font.fnt'));
        // middleFont = await jimp.loadFont(jimp.FONT_SANS_32_WHITE);
        // smallFont = await jimp.loadFont(jimp.FONT_SANS_32_WHITE);
    
        for (const idx in quotes) {
            const quote = quotes[idx];
            await this.render(quote, idx);
        }
        
    }
    
}

module.exports = Renderer;