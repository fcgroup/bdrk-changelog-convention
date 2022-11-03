const Q = require('q');
const readFile = Q.denodeify(require('fs').readFile);
const resolve = require('path').resolve;

function getCommitGroup(type) {
  switch (type) {
    case 'breaking':
    case 'major':
      return 'Breaking Changes';
    case 'feat':
    case 'feature':
    case 'minor':
      return 'New Features';
    default:
      return 'Other Changes';
  }
}

function getWriterOpts() {
  return {
    transform: (commit) => {
      if (!commit.type) {
        commit.type = 'patch';
      }

      commit.group = getCommitGroup(commit.type);

      // Parse the issue number from the commit message.
      // This assumes (by convention) Jira issue numbers.
      const issue = commit.subject.match(/^[A-Z0-9]+-\d+/);
      if (issue) {
        commit.issue = issue[0];
      }

      // Parse the prose from the commit message.
      const message = commit.subject.match(/: (.*)/);
      if (message) {
        // Remove the trailing version qualifier keyword in parenthesis.
        commit.message = message[1].replace(/( )*\((major|minor|patch|breaking|feat|feature|fix)\)/, '');
      }

      if (!commit.message || commit.message.match(/Merge pull request #\d*/)) {
        // Don't consider merge commits – the underlying commits will each be evaluated.
        return;
      }

      return commit;
    },
    groupBy: 'group',
    commitGroupsSort: 'title',
    commitsSort: ['type', 'message'],
    parserOpts: {
      headerPattern: /.*:(.*)\(*/,
    },
  };
}

module.exports = Q.all([
  readFile(resolve(__dirname, './templates/template.hbs'), 'utf-8'),
  readFile(resolve(__dirname, './templates/header.hbs'), 'utf-8'),
  readFile(resolve(__dirname, './templates/commit.hbs'), 'utf-8'),
])
  .spread((template, header, commit) => {
    const writerOpts = getWriterOpts();

    writerOpts.mainTemplate = template;
    writerOpts.headerPartial = header;
    writerOpts.commitPartial = commit;

    return writerOpts;
  });
