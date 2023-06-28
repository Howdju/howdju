const fs = require("fs");
const pathModule = require("path");

/**
 * A custom Jest resolver.
 *
 * Supports 1) project-relative imports in dependencies of the test package, and 2) resolving
 * dependencies of linked local dependencies.
 */
module.exports = function customJestResolver(path, options) {
  // If path begins with `@` (which is how we indicate a project-relative import) then
  // replace the @ with the subdirectory of the closest package to the importing file that contains
  // the source. (The subdirectory will be `src` or `lib`, but so long as we can assume that it's in
  // the same subdirectory as the importing file, the specific name doesn't matter.)
  // `options.basedir` is the directory of the importing file, so find the package root by
  // traversing up from options.basedir until finding a package.json, and then use the previous dir.
  if (path.startsWith("@/")) {
    const resolvedPath = resolveProjectRelativePath(path, options.basedir);
    if (resolvedPath) {
      return options.defaultResolver(resolvedPath, options);
    }
    return options.defaultResolver(path, options);
  }

  const { basedir } = options;
  // For the dependencies we link locally for development, resolve
  // their peer dependencies with a basedir of the mobile app package so that they will find their
  // dependencies in our node_modules.
  //
  // Currently we hard-code the locally linked packages. A
  // more robust approach would be to read the monorepo's package for all
  // resolutions, resolve their path to an absolute path, and test for equality
  // between that and the basedir.
  //
  // Currently we resolve all linked package dependencies with a basedir of
  // the mobile app's rootDir, but a more robust approach might be to read the
  // package of each dependency and only perform this manipulation for peer
  // dependencies.
  if (basedir.endsWith("/react-native-share-menu")) {
    // console is not recognized as an exported global. But this is the only way
    // I know to log here, and I'd prefer to be noisy rather than lose sight of
    // this custom override to resolution.
    console.log(
      `Replacing linked basedir ${basedir} with rootDir ${options.rootDir} while resolving path ${path}`
    );
    options = { ...options, basedir: options.rootDir };
  }

  return options.defaultResolver(path, options);
};

function resolveProjectRelativePath(path, initDir) {
  let currDir = initDir;
  let prevDir;
  while (currDir) {
    if (fs.existsSync(pathModule.join(currDir, "package.json"))) {
      if (!prevDir) {
        console.log(
          `Unable to resolve project-relative path ${path} because we started in a directory with package.json: ${initDir}`
        );
        return null;
      }
      return pathModule.join(prevDir, path.substring(2));
    }
    prevDir = currDir;
    currDir = pathModule.dirname(currDir);
  }
  console.log(
    `Unable to resolve project-relative path ${path} from ${initDir} because we found no package.json above it.`
  );
  return null;
}
