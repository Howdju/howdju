const path = require("path");
const fs = require("fs");

class ProjectRelativeImportResolverPlugin {
  constructor(options = {}) {
    this.options = options;
    this.projectSources = {
      ...options.projectSources,
      default: "lib",
    };
  }

  apply(compiler) {
    const pluginName = this.constructor.name;

    compiler.hooks.normalModuleFactory.tap(
      pluginName,
      (normalModuleFactory) => {
        normalModuleFactory.hooks.beforeResolve.tap(
          pluginName,
          (resolveData) => {
            if (resolveData.request && resolveData.request.startsWith("@/")) {
              const packageJsonPath = this.findNearestPackageJson(
                resolveData.context
              );
              if (packageJsonPath) {
                const packageDir = path.dirname(packageJsonPath);
                const projectName = path.basename(packageDir);
                const sourceDir =
                  this.projectSources[projectName] ||
                  this.projectSources.default;
                const projectRelativePath = resolveData.request.slice(2); // Remove '@/'
                resolveData.request = path.join(
                  packageDir,
                  sourceDir,
                  projectRelativePath
                );
              }
            }
            // Do not return anything unless you want to stop the resolution process
          }
        );
      }
    );
  }

  findNearestPackageJson(startDir) {
    let currentDir = startDir;
    while (currentDir !== path.parse(currentDir).root) {
      const packageJsonPath = path.join(currentDir, "package.json");
      if (fs.existsSync(packageJsonPath)) {
        return packageJsonPath;
      }
      currentDir = path.dirname(currentDir);
    }
    return null;
  }
}

module.exports = ProjectRelativeImportResolverPlugin;
