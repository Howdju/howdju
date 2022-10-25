// A custom Jest resolver for linked deps
module.exports = (path, options) => {
  const {basedir} = options
  // For the dependencies we link locally for development, resolve
  // their peer dependencies with a basedir of the mobile app package.
  //
  // Currently we check directly for the locally linked packages. A
  // more robust approach would be to read the monorepo's package for all
  // resolutions, resolve their path to an absolute path, and test for equality
  // between that and the basedir.
  //
  // Currently we resolve all linked package dependencies with a basedir of
  // the mobile app's rootDir, but a more robust approach might be to read the
  // package of each dependency and only perform this manipulation for peer
  // dependencies.
  if (basedir.endsWith('/react-native-share-menu')) {
    // console is not recognized as an exported global. But this is the only way
    // I know to log here, and I'd prefer to be noisy rather than loose sight of
    // this custom override to resolution.
    console.log(
      `Replacing linked basedir ${basedir} with rootDir ${options.rootDir} while resolving path ${path}`,
    )
    options = {...options, basedir: options.rootDir}
  }

  return options.defaultResolver(path, options)
}
