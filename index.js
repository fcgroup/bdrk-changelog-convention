const Q = require('q');
const conventionalChangelog = require('./conventional-changelog');
const parserOpts = require('./parser-opts');
const recommendedBumpOpts = require('./conventional-recommended-bump');
const writerOpts = require('./writer-opts');

function presetOpts(cb) {
  Q.all([conventionalChangelog, parserOpts, recommendedBumpOpts, writerOpts])
    .spread((_conventionalChangelog, _parserOpts, _recommendedBumpOpts, _writerOpts) => {
      cb(null, {
        conventionalChangelog: _conventionalChangelog,
        parserOpts: _parserOpts,
        recommendedBumpOpts: _recommendedBumpOpts,
        writerOpts: _writerOpts,
      });
    });
}

module.exports = presetOpts;
