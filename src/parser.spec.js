import { expect, test } from 'vitest';
import { createParserOpts } from './parser.js';

test('maps the header captures to message and type', () => {
  const { headerCorrespondence } = createParserOpts();

  expect(headerCorrespondence).toEqual(['message', 'type']);
});

test('header pattern captures the message and the version qualifier', () => {
  const { headerPattern } = createParserOpts();

  const match = 'ABC-123: add a thing (feat)'.match(headerPattern);

  expect(match[1]).toBe('ABC-123: add a thing ');
  expect(match[2]).toBe('feat');
});

test('header pattern does not match commits without a version qualifier', () => {
  const { headerPattern } = createParserOpts();

  expect('ABC-123: add a thing'.match(headerPattern)).toBeNull();
  expect('ABC-123: add a thing (docs)'.match(headerPattern)).toBeNull();
});
