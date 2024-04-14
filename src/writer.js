import { readFile, stat } from 'fs/promises';
import { resolve } from 'path';
import { fileURLToPath } from 'url'

const dirname = fileURLToPath(new URL('.', import.meta.url));

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

async function exists(path) {
  try {
    await stat(path);
    return true;
  }
  catch {
    return false;
  }
}

async function getIssueBaseUrl() {
  // Check if it is supplied as an environment variable
  if (process.env.BDRK_ISSUE_BASE_URL) {
    return process.env.BDRK_ISSUE_BASE_URL;
  }

  // Check if it exists in the semantic-release config
  if (await exists('.releaserc.json')) {
    const releaseConfig = JSON.parse(await readFile('.releaserc.json', 'utf-8'));
    const notesConfig = releaseConfig.plugins.find(x => x[0] === '@semantic-release/release-notes-generator');

    if (notesConfig && notesConfig[1].issueUrlPrefix) {
      return notesConfig[1].issueUrlPrefix.replace(/\/$/, '');
    }
  }

  // Check if the package.json contains a `bugs` key.
  if (await exists('package.json')) {
    const packageJson = JSON.parse(await readFile('package.json', 'utf-8'));
    if (packageJson.bugs?.url) {
      return packageJson.bugs.url.replace(/\/$/, '');
    }
  }

  return '#';
}

export async function createWriterOpts() {
  const [ template, header, commit ] = await Promise.all([
    readFile(resolve(dirname, './templates/template.hbs'), 'utf-8'),
    readFile(resolve(dirname, './templates/header.hbs'), 'utf-8'),
    readFile(resolve(dirname, './templates/commit.hbs'), 'utf-8'),
  ]);

  const writerOpts = getWriterOpts();

  writerOpts.mainTemplate = template;
  writerOpts.headerPartial = header;
  writerOpts.commitPartial = commit.replace(/{{BDRK_ISSUE_BASE_URL}}/gm, await getIssueBaseUrl());

  return writerOpts;
}
