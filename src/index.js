import { createParserOpts } from './parser.js';
import { createWriterOpts } from './writer.js';
import { whatBump } from './bump.js';

// Default export is required for plugin compatibility.
// eslint-disable-next-line import/no-default-export
export default async function createPreset() {
  const parserOpts = createParserOpts();
  const writerOpts = await createWriterOpts();

  return {
    parser: parserOpts,
    writer: writerOpts,
    parserOpts,
    writerOpts,
    whatBump,
  };
}
