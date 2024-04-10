export function createParserOpts() {
  return {
    headerPattern: /(.*)\((major|minor|patch|breaking|feat|feature|fix)\)/,
    headerCorrespondence: [
      'message',
      'type',
    ],
  };
}
