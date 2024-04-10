import { readFile } from 'fs/promises';
import { resolve } from 'path';

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

export async function createWriterOpts() {
  const writerOpts = getWriterOpts();
  writerOpts.mainTemplate = await readFile(resolve(__dirname, './templates/template.hbs'), 'utf-8');
  writerOpts.headerPartial = await readFile(resolve(__dirname, './templates/header.hbs'), 'utf-8');
  writerOpts.commitPartial = await readFile(resolve(__dirname, './templates/commit.hbs'), 'utf-8');
  return writerOpts;
}
