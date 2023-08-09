const fs = require("fs");
const os = require("os");
const path = require("path");
const zip = new require("node-zip");
const { ArgumentParser } = require("argparse");
const debug = require("debug")(
  "howdju:premiser-api:update-lambda-function-code"
);

const { lambda, NodePlatforms } = require("howdju-ops");

const parser = new ArgumentParser({
  description: "Create a ZIP file containing the API Lambda's files",
});
parser.add_argument("--extra-file", { nargs: "*", default: [] });
const args = parser.parse_args();

const lambdarcPath = path.resolve("lambdarc");
debug(`${{ lambdarcPath }}`);
const lambdarc = require(lambdarcPath);
const lambdaName = lambdarc.name;

if (lambdarc.requiresNativeBuild && os.platform() !== NodePlatforms.LINUX) {
  throw new Error(
    `Lambda function ${lambdaName} includes native dependencies and so must use a Linux (current platform: ${os.platform()})`
  );
}

const packagePath = process.cwd();
const distDir = path.resolve(process.cwd(), "dist");
const zipFile = zip();

const lambdaFilePaths = ["index.js", "index.js.map"].map((f) =>
  path.join(distDir, f)
);
const extraFilePaths = args.extra_file.map((f) => path.join(packagePath, f));
const allFilePaths = lambdaFilePaths.concat(extraFilePaths);
for (const filePath of allFilePaths) {
  const data = fs.readFileSync(filePath);
  const filename = path.basename(filePath);
  zipFile.file(filename, data);
}
const zipData = zipFile.generate({ base64: false, compression: "DEFLATE" });
const zipPath = path.join(distDir, `${lambdaName}.zip`);
fs.writeFileSync(zipPath, zipData, "binary");

lambda.updateFunctionCode(lambdaName, zipPath);
