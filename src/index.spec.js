import { expect, test } from 'vitest';
import createPreset from './index.js';
import { whatBump } from './bump.js';

test('createPreset wires the parser, writer, and bump configuration together', async () => {
  const preset = await createPreset();

  expect(preset.parserOpts.headerPattern).toBeInstanceOf(RegExp);
  expect(preset.writerOpts.transform).toBeInstanceOf(Function);
  expect(preset.whatBump).toBe(whatBump);

  // conventional-changelog consumers read `parser`/`writer`, while
  // semantic-release reads `parserOpts`/`writerOpts` – both must be present.
  expect(preset.parser).toBe(preset.parserOpts);
  expect(preset.writer).toBe(preset.writerOpts);
});
