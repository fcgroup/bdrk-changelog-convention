import { createParserOpts } from './parser.js';
import { createWriterOpts } from './writer.js';
import { whatBump } from './bump.js';

// Default export is required for plugin compatibility.
// eslint-disable-next-line import/no-default-export
export default async function createPreset() {
  return {
    parser: createParserOpts(),
    writer: await createWriterOpts(),
    whatBump,
  }
}
