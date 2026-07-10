import { mkdtemp, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, test, expect, vi } from 'vitest';
import { createWriterOpts } from './writer.js';

// getIssueBaseUrl() resolves `.releaserc.json` and `package.json` relative to
// the working directory, so run createWriterOpts() from a temp fixture dir to
// exercise its branches.
async function createWriterOptsIn(files) {
  const dir = await mkdtemp(join(tmpdir(), 'writer-spec-'));
  await Promise.all(Object.entries(files).map(
    ([name, content]) => writeFile(join(dir, name), JSON.stringify(content)),
  ));

  const cwd = process.cwd();
  process.chdir(dir);
  try {
    return await createWriterOpts();
  }
  finally {
    process.chdir(cwd);
  }
}

afterEach(() => {
  vi.unstubAllEnvs();
});

// Faithful reproduction of conventional-changelog-writer@8's immutable proxy
// (dist/commit.js `preventModifications`). Transforms receive this and must
// NOT mutate it; they must return a patch object of the fields to change.
function preventModifications(object) {
  return new Proxy(object, {
    get(target, prop) {
      const value = target[prop];
      if (value instanceof Date) {
        return value;
      }
      if (typeof value === 'object' && value !== null) {
        return preventModifications(value);
      }
      return value;
    },
    set() {
      throw new Error('Cannot modify immutable object.');
    },
    deleteProperty() {
      throw new Error('Cannot modify immutable object.');
    },
  });
}

test('transform does not mutate an immutable commit and groups by type', async () => {
  const { transform } = await createWriterOpts();
  const commit = preventModifications({ type: 'feat', subject: 'ABC-123: add thing (feat)' });

  const patch = transform(commit);

  expect(patch.group).toBe('New Features');
  expect(patch.type).toBe('feat');
});

test('transform infers patch type when type is missing', async () => {
  const { transform } = await createWriterOpts();
  const commit = preventModifications({ subject: 'ABC-123: tweak thing (fix)' });

  const patch = transform(commit);

  expect(patch.type).toBe('patch');
  expect(patch.group).toBe('Other Changes');
});

test('transform extracts the Jira issue and prose message', async () => {
  const { transform } = await createWriterOpts();
  const commit = preventModifications({ type: 'feat', subject: 'ABC-123: add thing (feat)' });

  const patch = transform(commit);

  expect(patch.issue).toBe('ABC-123');
  expect(patch.message).toBe('add thing');
});

test('transform drops merge commits', async () => {
  const { transform } = await createWriterOpts();
  const commit = preventModifications({ type: 'feat', subject: ': Merge pull request #42 from foo' });

  const patch = transform(commit);

  expect(patch).toBeUndefined();
});

test('transform drops commits with no prose message', async () => {
  const { transform } = await createWriterOpts();
  const commit = preventModifications({ type: 'feat', subject: 'no colon here' });

  const patch = transform(commit);

  expect(patch).toBeUndefined();
});

test('transform groups breaking and major commits under Breaking Changes', async () => {
  const { transform } = await createWriterOpts();

  const breaking = transform(preventModifications({ type: 'breaking', subject: 'ABC-1: redo api (breaking)' }));
  const major = transform(preventModifications({ type: 'major', subject: 'ABC-2: redo api (major)' }));

  expect(breaking.group).toBe('Breaking Changes');
  expect(major.group).toBe('Breaking Changes');
});

test('createWriterOpts loads the handlebars templates', async () => {
  const opts = await createWriterOpts();

  expect(opts.mainTemplate).toContain('{{');
  expect(opts.headerPartial).toContain('{{');
  expect(opts.commitPartial).toContain('{{');
});

test('issue base URL is taken from the environment when set', async () => {
  vi.stubEnv('BDRK_ISSUE_BASE_URL', 'https://issues.example.com/browse');

  const opts = await createWriterOpts();

  expect(opts.commitPartial).toContain('https://issues.example.com/browse/{{issue}}');
});

test('issue base URL is taken from the semantic-release config, without trailing slash', async () => {
  vi.stubEnv('BDRK_ISSUE_BASE_URL', undefined);

  const opts = await createWriterOptsIn({
    '.releaserc.json': {
      plugins: [
        '@semantic-release/commit-analyzer',
        ['@semantic-release/release-notes-generator', { issueUrlPrefix: 'https://jira.example.com/browse/' }],
      ],
    },
  });

  expect(opts.commitPartial).toContain('https://jira.example.com/browse/{{issue}}');
});

test('issue base URL falls back to the package.json bugs URL, without trailing slash', async () => {
  vi.stubEnv('BDRK_ISSUE_BASE_URL', undefined);

  const opts = await createWriterOptsIn({
    '.releaserc.json': {
      plugins: [
        ['@semantic-release/release-notes-generator', {}],
      ],
    },
    'package.json': {
      bugs: { url: 'https://github.com/fcgroup/example/issues/' },
    },
  });

  expect(opts.commitPartial).toContain('https://github.com/fcgroup/example/issues/{{issue}}');
});

test('issue base URL falls back to "#" when no source provides one', async () => {
  vi.stubEnv('BDRK_ISSUE_BASE_URL', undefined);

  const opts = await createWriterOptsIn({
    '.releaserc.json': {},
    'package.json': { name: 'example' },
  });

  expect(opts.commitPartial).toContain('#/{{issue}}');
});

test('issue base URL falls back to "#" when no config files exist', async () => {
  vi.stubEnv('BDRK_ISSUE_BASE_URL', undefined);

  const opts = await createWriterOptsIn({});

  expect(opts.commitPartial).toContain('#/{{issue}}');
});
