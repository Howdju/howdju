const fs = require("fs");
const path = require("path");
const zip = new require("node-zip");
const { ArgumentParser } = require("argparse");

const { logger } = require("howdju-ops");

const parser = new ArgumentParser({
  description: "Create a ZIP file containing a Lambda's files",
});
parser.add_argument("--extra-file", { nargs: "*", default: [] });
const args = parser.parse_args();

// Assume we are run from the lambda package root
const packagePath = process.cwd();
const packageInfoPath = path.resolve(packagePath, "package.json");
const packageInfo = JSON.parse(fs.readFileSync(packageInfoPath));
logger.info(`Zipping lambda ${packageInfo.name}`);

const distDir = path.resolve(packagePath, "dist");
const zipFile = zip();
const lambdaFilePaths = ["index.js", "index.js.map"].map((f) =>
  path.join(distDir, f)
);
const extraFilePaths = args.extra_file.map((f) => path.join(packagePath, f));
const allFilePaths = lambdaFilePaths.concat(extraFilePaths);
for (let filePath of allFilePaths) {
  const data = fs.readFileSync(filePath);
  const filename = path.basename(filePath);
  zipFile.file(filename, data);
}
const zipData = zipFile.generate({ base64: false, compression: "DEFLATE" });
const zipPath = path.join(distDir, `lambda.zip`);
fs.writeFileSync(zipPath, zipData, "binary");
logger.info(`Wrote ${zipPath}`);
