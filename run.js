const Renderer = require('./lib/renderer');
const path = require('path');
const fs = require('fs');

const renderer = new Renderer({
    'font_path': path.resolve(__dirname, 'assets/fonts/american-typewriter'),
    'quotes': fs.readFileSync('./quotes.txt', 'utf8')
});

renderer.run();