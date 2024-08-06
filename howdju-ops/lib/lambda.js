const AWS = require("aws-sdk");
const childProcess = require("child_process");
const fs = require("fs");
const isNumber = require("lodash/isNumber");
const toNumber = require("lodash/toNumber");
const toString = require("lodash/toString");

const { logger } = require("./logger");

// See https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Lambda.html
const lambda = new AWS.Lambda({ apiVersion: "2015-03-31" });

// e.g.: 15da8df Testing logging JSON
const getGitDescription = () =>
  childProcess.execSync("git log --oneline -1").toString().trim();

const updateFunctionCode = (functionName, functionCodeZipPath) => {
  logger.info("Updating Lambda Function", {
    functionName,
    functionCodeZipPath,
  });
  fs.readFile(functionCodeZipPath, (err, data) => {
    if (err) throw err;

    const params = {
      FunctionName: functionName,
      Publish: false, // This boolean parameter can be used to request AWS Lambda to update the Lambda function and publish a version as an atomic operation.
      ZipFile: data,
    };
    lambda.updateFunctionCode(params, (err, data) => {
      if (err) throw err;

      ensureLambdaFunctionIsActive(functionName, new Date(), () => {
        logger.info("Uploaded Lambda Function", {
          functionName,
          codeSha256: data["CodeSha256"],
        });
      });
    });
  });
};

function ensureLambdaFunctionIsActive(functionName, startTimestamp, callback) {
  // Throw if 1 minute has passed
  if (new Date() - startTimestamp > 60 * 1000) {
    throw new Error("Lambda function update timed out");
  }
  lambda.getFunction({ FunctionName: functionName }, (err, data) => {
    if (err) throw err;
    logger.info("Lambda getFunction data:", {
      functionName,
      data,
    });
    if (data["Configuration"]["State"] === "Active") {
      callback();
    } else {
      setTimeout(() => {
        ensureLambdaFunctionIsActive(functionName, startTimestamp, callback);
      }, 1000);
    }
  });
}

const publishVersion = (functionName, description = null) => {
  if (!description) {
    description = getGitDescription();
  }
  const params = {
    FunctionName: functionName,
    Description: description,
  };
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Lambda.html#publishVersion-property
  lambda.publishVersion(params, function (err, data) {
    if (err) throw err;
    const version = data.Version;
    logger.info("Published lambda", { functionName, version });
  });
};

const updateAlias = (functionName, aliasName, newTarget) => {
  if (/[0-9]+/.test(newTarget)) {
    logger.info("Updating Lambda Function alias", {
      aliasName,
      newTarget,
      newVersion: newTarget,
    });
    updateAliasToVersion(functionName, aliasName, newTarget);
  } else {
    return getAliasVersion(functionName, newTarget, (err, newVersion) => {
      if (err) throw err;
      logger.info("Updating Lambda Function alias", {
        aliasName,
        newTarget,
        newVersion,
      });
      updateAliasToVersion(functionName, aliasName, newVersion);
    });
  }
};

const getAliasVersion = (functionName, aliasName, cb) => {
  const params = {
    FunctionName: functionName,
    Name: aliasName,
  };
  lambda.getAlias(params, function (err, data) {
    if (err) return cb(err);
    cb(null, data["FunctionVersion"]);
  });
};

const updateAliasToVersion = (functionName, aliasName, targetVersion) => {
  if (!isNumber(toNumber(targetVersion))) {
    throw new Error("targetVersion must be a number");
  }

  getAliasVersion(functionName, aliasName, (err, previousVersion) => {
    if (err) throw err;
    const Name = aliasName;
    // FunctionVersion must be a string representation of a number
    const FunctionVersion = toString(targetVersion);
    const params = {
      FunctionName: functionName,
      Name,
      FunctionVersion,
    };
    // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Lambda.html#updateAlias-property
    lambda.updateAlias(params, function (err, data) {
      if (err) throw err;
      logger.info(`Updated Lambda Function alias`, {
        aliasName,
        newVersion: targetVersion,
        previousVersion,
      });
    });
  });
};

exports.lambda = {
  updateFunctionCode,
  publishVersion,
  updateAlias,
};
