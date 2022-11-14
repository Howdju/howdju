const { ArgumentParser } = require("argparse");
const path = require("path");

const { lambda } = require("howdju-ops");

const parser = new ArgumentParser({
  description: "Update an AWS Lambda function alias",
});
parser.add_argument("--lambdaDir", { required: true });
parser.add_argument("--aliasName", { required: true });
parser.add_argument("--newTarget", { required: true });
const args = parser.parse_args();

const lambdarcPath = path.resolve(
  "lambda-functions",
  args.lambdaDir,
  "lambdarc"
);
const lambdarc = require(lambdarcPath);

lambda.updateAlias(lambdarc.name, args.aliasName, args.newTarget);
