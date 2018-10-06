const path = require('path');
const glob = require('glob');
const fs = require('fs-extra');
const jimp = require('jimp');
const IMAGE_WIDTH = 1366;
const IMAGE_HEIGHT = 768;
const processedDir = path.resolve(__dirname, 'assets/processed');
const _ = require('lodash');

class SourceResolver {
    
    getImage() {
        const res = this.src[this.index];
        this.index++;
        if (this.index > this.src.length - 1) {
            this.index = 0;
        }
        return res;
    }
    
    async processRaw() {
        
        fs.ensureDirSync(processedDir);
        
        for (const image of this.rawImages) {
            const filename = path.basename(image);
            const dest = path.resolve(processedDir, filename);
            if (fs.pathExistsSync(dest)) {
                continue;
            }
            const img = await jimp.read(image);
            img.cover(IMAGE_WIDTH, IMAGE_HEIGHT, jimp.HORIZONTAL_ALIGN_LEFT | jimp.VERTICAL_ALIGN_TOP);
            await img.writeAsync(dest);
        }
        
    }
    
    async init() {
        
        this.index = 0;
        
        this.images = glob.sync('*.jpg', {
            'cwd': path.resolve(__dirname, 'assets/backgrounds'),
            'absolute': true
        });
        
        this.rawImages = glob.sync('*.jpg', {
            'cwd': path.resolve(__dirname, 'assets/raw_backgrounds'),
            'absolute': true
        });

        await this.processRaw();
        
        this.processedImages = glob.sync('*.jpg', {
            'cwd': path.resolve(__dirname, 'assets/processed'),
            'absolute': true
        });
        
        this.src = _.shuffle(this.images.concat(this.processedImages));
        
    }
    
}

module.exports = SourceResolver;