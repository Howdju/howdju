const fs = require("fs");
const os = require("os");
const path = require("path");
const zip = new require("node-zip");
const debug = require("debug")(
  "howdju:premiser-api:update-lambda-function-code"
);

const { lambda, NodePlatforms } = require("howdju-ops");

const lambdarcPath = path.resolve("lambdarc");
debug(`${{ lambdarcPath }}`);
const lambdarc = require(lambdarcPath);
const lambdaName = lambdarc.name;

if (lambdarc.requiresNativeBuild && os.platform() !== NodePlatforms.LINUX) {
  throw new Error(
    `Lambda function ${lambdaName} includes native dependencies and so must use a Linux (current platform: ${os.platform()})`
  );
}

const distDir = path.resolve(process.cwd(), "dist");
const zipFile = zip();
for (let filename of ["index.js", "index.js.map"]) {
  const data = fs.readFileSync(path.join(distDir, filename));
  zipFile.file(filename, data);
}
const zipData = zipFile.generate({ base64: false, compression: "DEFLATE" });
const zipPath = path.join(distDir, `${lambdaName}.zip`);
fs.writeFileSync(zipPath, zipData, "binary");

lambda.updateFunctionCode(lambdaName, zipPath);
