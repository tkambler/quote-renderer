const Renderer = require('./lib/renderer');
const path = require('path');

const renderer = new Renderer({
    'font_path': path.resolve(__dirname, 'assets/fonts/american-typewriter'),
    'quotes': path.resolve(__dirname, 'quotes.txt')
});

renderer.run();