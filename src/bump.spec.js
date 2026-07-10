import { expect, test } from 'vitest';
import { whatBump } from './bump.js';

test('returns a patch-level bump for an empty commit list', () => {
  const result = whatBump([]);

  expect(result.level).toBe(2);
  expect(result.reason).toBe('There are 0 breaking changes, 0 new features, and 0 fixes.');
});

test('breaking and major commits produce a major bump', () => {
  const result = whatBump([
    { type: 'breaking' },
    { type: 'major' },
  ]);

  expect(result.level).toBe(0);
  expect(result.reason).toBe('There are 2 breaking changes, 0 new features, and 0 fixes.');
});

test('feat, feature, and minor commits produce a minor bump', () => {
  const result = whatBump([
    { type: 'feat' },
    { type: 'feature' },
    { type: 'minor' },
  ]);

  expect(result.level).toBe(1);
  expect(result.reason).toBe('There are 0 breaking changes, 3 new features, and 0 fixes.');
});

test('any other commit type counts as a fix and produces a patch bump', () => {
  const result = whatBump([
    { type: 'fix' },
    { type: 'patch' },
  ]);

  expect(result.level).toBe(2);
  expect(result.reason).toBe('There are 0 breaking changes, 0 new features, and 2 fixes.');
});

test('commit types are matched case-insensitively', () => {
  const result = whatBump([{ type: 'FEAT' }]);

  expect(result.level).toBe(1);
  expect(result.reason).toBe('There are 0 breaking changes, 1 new features, and 0 fixes.');
});

test('commits without a type are ignored', () => {
  const result = whatBump([{ type: null }, {}]);

  expect(result.level).toBe(2);
  expect(result.reason).toBe('There are 0 breaking changes, 0 new features, and 0 fixes.');
});

test('a minor commit does not downgrade an earlier major bump', () => {
  const result = whatBump([
    { type: 'breaking' },
    { type: 'feat' },
  ]);

  expect(result.level).toBe(0);
  expect(result.reason).toBe('There are 1 breaking changes, 1 new features, and 0 fixes.');
});
