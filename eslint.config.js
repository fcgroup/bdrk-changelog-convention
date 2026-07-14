import bdrk from '@bdrk/eslint-config';

// eslint-disable-next-line import-x/no-default-export -- ESLint requires a default-exported config
export default [
  { ignores: ['coverage/**'] },
  ...bdrk,
];
