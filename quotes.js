const fs = require('fs');
const s = require('underscore.string');
const quotes = s.lines(fs.readFileSync('./quotes.txt', 'utf8'))
    .map(s.clean)
    .filter(line => line)
    .map(line => {
        const tmp = line.split('--');
        return {
            quote: s.clean(tmp[0]),
            source: s.clean(tmp[1])
        };
    });
    
module.exports = quotes;