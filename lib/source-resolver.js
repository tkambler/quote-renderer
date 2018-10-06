const assert = require('assert');
const path = require('path');
const glob = require('glob');
const _ = require('lodash');
const imageSize = require('image-size');

class SourceResolver {
    
    constructor(options = {}) {
        
        assert(options.background_path);
        
        this.options = options;
        
    }
    
    getDimensions(img) {
        
        this.dimensions = this.dimensions || {};
        if (!this.dimensions[img]) {
            this.dimensions[img] = imageSize(img);
        }
        return this.dimensions[img];
        
    }
    
    getImage() {
        
        const res = this.src[this.index];
        this.index++;
        if (this.index > this.src.length - 1) {
            this.index = 0;
        }
        
        return {
            'image': res,
            'dimensions': this.getDimensions(res)
        };
        
    }
    
    async init() {
        
        this.index = 0;
        
        this.images = glob.sync('*.jpg', {
            'cwd': this.options.background_path,
            'absolute': true
        });
        
        this.src = _.shuffle(this.images);
        
    }
    
}

module.exports = SourceResolver;