const Q = require('q');
const parserOpts = require('./parser-opts');
const writerOpts = require('./writer-opts');

module.exports = Q.all([parserOpts, writerOpts])
  .spread((_parserOpts, _writerOpts) => {
    return { parserOpts: _parserOpts, writerOpts: _writerOpts };
  });
