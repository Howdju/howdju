/** Just a root .eslintcr to prevent searching below our workspace root.
 *
 * See eslint-config-howdju for our config.
 */
module.exports = {
  root: true,
  parserOptions: {
    project: ["./tsconfig.json"],
  },
};
