const FontManager = require('./font-manager');
const loadQuotes = require('./quote-loader');
const jimp = require('jimp');
const fs = require('fs-extra');
const path = require('path');
const IMAGE_WIDTH = 1366;
const IMAGE_HEIGHT = 768;
const SourceResolver = require('./source-resolver');
const debug = require('debug')('quote-renderer');
const destDir = path.resolve(__dirname, '../output');
const ProgressBar = require('progress');
let overlay;

class Renderer {
    
    constructor(options = {}) {
        
        this.options = options;
        
    }
    
    async init() {
        
        this.quotes = loadQuotes(this.options.quotes, true);
        
        this.progress = new ProgressBar(':bar ETA: :eta (seconds)', {
            total: this.quotes.length,
            width: 100
        });
        
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
        const sourceFont = await this.fonts.calculateFont(source, 50, 1055);
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

        this.progress.tick();
        
    }
    
    async run() {
        
        await this.init();
    
        for (const idx in this.quotes) {
            const quote = this.quotes[idx];
            await this.render(quote, idx);
        }
        
    }
    
}

module.exports = Renderer;