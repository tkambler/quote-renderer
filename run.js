const Renderer = require('./lib/renderer');
const path = require('path');

const renderer = new Renderer({
    // The folder from which fonts are to be loaded
    'font_path': path.resolve(__dirname, 'assets/fonts/american-typewriter'),
    // The folder to which generated images are to be saved
    'output_path': path.resolve(__dirname, 'output'),
    // The folder from which to pull background images.
    'background_path': path.resolve(__dirname, 'assets/images'),
    // A text file containing quotes. Each quote should appear on its own line. The quote and the source
    // should be separated by two dashes (--). For example:
    // Brevity is the soul of wit. -- William Shakespeare
    'quotes': path.resolve(__dirname, 'quotes.txt')
});

renderer.run();