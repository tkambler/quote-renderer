'use strict';

const glob = require('glob');
const s = require('underscore.string');
const path = require('path');
const jimp = require('jimp');

/**
 * FontManager
 */
class FontManager {
    
    constructor(options = {}) {
        this.path = options.path;
    }
    
    async init() {
        
        this.fonts = glob.sync('*/', {
            'cwd': this.path
        })
            .map((size) => {
                return parseInt(s.rtrim(size, '/'), 10);
            })
            .sort()
            .map((size) => {
                return {
                    size,
                    path: path.resolve(this.path, size.toString(), 'font.fnt')
                };
            });
        
        for ( const font of this.fonts ) {
            font.jimpFont = await jimp.loadFont(font.path);
        }
            
    }
    
    async calculateFont(quote, maxHeight, width, maxFontSize) {
        
        let prev;
        
        for ( const font of this.fonts ) {
            
            if (maxFontSize && font.size > maxFontSize) {
                continue;
            }
            
            const item = {
                font,
                height: jimp.measureTextHeight(font.jimpFont, quote, width)
            };
            
            if (item.height > maxHeight) {
                break;
            }
            
            prev = item;
            
        }
        
        if (!prev) {
            const err = new Error(`Unable to calculate font for quote: ${quote}`);
            err.code = 'FONT_CALCULATION_ERROR';
            throw err;
        }
        
        return {
            font: prev.font.jimpFont,
            size: prev.font.size,
            height: prev.height
        }
        
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
    
}

module.exports = FontManager;