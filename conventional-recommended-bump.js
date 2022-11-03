const parserOpts = require('./parser-opts');

module.exports = {
  parserOpts,

  whatBump: (commits) => {
    let level = 2;
    let major = 0;
    let minor = 0;
    let patch = 0;

    commits.forEach(commit => {
      if (!commit.type) {
        return;
      }

      switch (commit.type.toLowerCase()) {
        case 'breaking':
        case 'major':
          major += 1;
          level = 0;
          break;
        case 'feat':
        case 'feature':
        case 'minor':
          minor += 1;
          if (level >= 2) {
            level = 1;
          }
          break;
        default:
          patch += 1;
          break;
      }
    });

    return {
      level,
      reason: `There are ${major} breaking changes, ${minor} new features, and ${patch} fixes.`,
    };
  },
};
