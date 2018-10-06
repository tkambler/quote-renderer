const assert = require('assert');
const FontManager = require('./font-manager');
const loadQuotes = require('./quote-loader');
const jimp = require('jimp');
const fs = require('fs-extra');
const path = require('path');
const SourceResolver = require('./source-resolver');
const debug = require('debug')('quote-renderer');
const ProgressBar = require('progress');
let overlay;

class Renderer {
    
    constructor(options = {}) {
        
        assert(options.font_path);
        assert(options.output_path);
        assert(options.quotes);
        
        this.options = options;
        
    }
    
    getHorizontalPadding(width) {
        
        return this._horizontalPadding ? this._horizontalPadding : this._horizontalPadding = Math.floor((width * .10) / 2);
        
    }
    
    getVerticalPadding(height) {
        
        return this._verticalPadding ? this._verticalPadding : this._verticalPadding = Math.floor((height * .10) / 2);
        
    }
    
    getMaxTextWidth(width) {
        
        return this._maxTextWidth ? this._maxTextWidth : this._maxTextWidth = width - (this.getHorizontalPadding(width) * 2);
        
    }
    
    getMaxTextHeight(height) {
        
        return this._maxTextHeight ? this._maxTextHeight : this._maxTextHeight = height - (this.getVerticalPadding(height) * 2);
        
    }
    
    getMaxQuoteHeight(height) {
        
        return this._maxQuoteHeight ? this._maxQuoteHeight : this._maxQuoteHeight = Math.floor(this.getMaxTextHeight(height) * .75);
        
    }
    
    getMaxSourceHeight(height) {
        
        return this._maxSourceHeight ? this._maxSourceHeight : this._maxSourceHeight = Math.floor(this.getMaxTextHeight(height) * .2);
        
    }
    
    getTextSpace(height) {
        
        return this._textSpace ? this._textSpace : this._textSpace = Math.floor(this.getMaxTextHeight(height) * .05);
        
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
        
        this.srcResolver = new SourceResolver({
            'background_path': this.options.background_path
        });
        await this.srcResolver.init();
        
        overlay = await jimp.read(path.resolve(__dirname, '../assets/overlay.jpg'));
        overlay.opacity(0.4);
        
        fs.emptyDirSync(this.options.output_path);
        
    }
        
    async render({ quote, source }, idx) {
        
        debug('Rendering quote:', `${quote} -- ${source}`);
        
        const srcImage = this.srcResolver.getImage();    
        const src = await jimp.read(srcImage.image);
    
        src.composite(overlay, 0, 0, {
            mode: jimp.BLEND_SOURCE_OVER,
            opacitySource: 1.0,
            opacityDest: 0.9
        });
    
        const quoteCoords = {};
        const quoteFont = await this.fonts.calculateFont(quote, this.getMaxQuoteHeight(srcImage.dimensions.height), this.getMaxTextWidth(srcImage.dimensions.width));
        const sourceFont = await this.fonts.calculateFont(source, this.getMaxSourceHeight(srcImage.dimensions.height), this.getMaxTextWidth(srcImage.dimensions.width), 36);
        const totalHeight = quoteFont.height + this.getTextSpace(srcImage.dimensions.height) + sourceFont.height;
        const topOffset = Math.floor((srcImage.dimensions.height - totalHeight) / 2);
        
        src.print(quoteFont.font, this.getHorizontalPadding(srcImage.dimensions.height), topOffset, {
            text: quote,
            alignmentX: jimp.HORIZONTAL_ALIGN_CENTER,
        }, this.getMaxTextWidth(srcImage.dimensions.width), quoteFont.height, (err, img, {x, y}) => {
            quoteCoords.x = x;
            quoteCoords.y = y;
        });
        
        src.print(sourceFont.font, this.getHorizontalPadding(srcImage.dimensions.height), quoteCoords.y + 50, {
            text: source,
            alignmentX: jimp.HORIZONTAL_ALIGN_CENTER,
        }, this.getMaxTextWidth(srcImage.dimensions.width), sourceFont.height);

        const destFile = path.resolve(this.options.output_path, `${idx}.jpg`);

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