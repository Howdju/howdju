import { ArgumentParser } from "argparse";
import { S3 } from "aws-sdk";
import Debug from "debug";
import { readFile, readdir, stat as _stat } from "fs";
import moment from "moment";
import { extname, resolve } from "path";

import { utcNow, gitCommitMetadataKey } from "howdju-common";
import { gitSha } from "howdju-ops";

import { version } from "../package.json";
import projectConfig from "../config/project.config";

const versionMetadataKey = "howdju-ui-version";
const debug = Debug("premiser-ui:upload-to-s3");

const argParser = new ArgumentParser({
  description: "Upload the web app to S3",
});
argParser.add_argument("bucket");
argParser.add_argument("--filter");
const args = argParser.parse_args();
const filter = args.filter && new RegExp(args.filter);

debug(`${argParser} ${args}`);

const s3 = new S3({ apiVersion: "2006-03-01" });

const contentTypes = {
  ".js": "application/javascript",
  ".png": "image/png",
  ".xml": "application/xml",
  ".ico": "image/x-icon",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".html": "text/html",
  ".css": "text/css",
  ".map": "application/octet-stream",
};

const upload = (filename) => {
  debug(`Reading ${filename}`);
  readFile(projectConfig.paths.dist(filename), (err, data) => {
    if (err) throw err;

    const extension = extname(filename);
    const duration = moment.duration(projectConfig.aws.cacheDuration);
    // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#upload-property
    const params = {
      Bucket: args.bucket,
      Key: filename,
      Body: data,
      Metadata: {
        [gitCommitMetadataKey]: gitSha(),
        [versionMetadataKey]: version,
      },
      ACL: "public-read",
      CacheControl: `public, max-age=${duration.seconds()}`,
      Expires: utcNow().add(duration).toDate(),
      ContentType: contentTypes[extension] || "application/octet-stream",
    };
    debug(`Uploading ${filename}`);
    s3.upload(params, function (err, data) {
      if (err) {
        debug(`Error uploading ${filename}: ${err}`);
        throw err;
      }
      debug(`Uploaded ${filename} to ${args.bucket} (ETag: ${data.ETag})`);
    });
  });
};

walkRelative(projectConfig.paths.dist(), upload);

function walk(dirPath, action) {
  debug(`Walking ${dirPath}`);
  readdir(dirPath, function (err, fileNames) {
    if (err) {
      throw err;
    }

    fileNames.forEach(function (fileName) {
      if (fileName[0] === ".") {
        return debug(`Skipping ${fileName}`);
      }
      const filePath = resolve(dirPath, fileName);
      debug(`Found ${filePath}`);
      _stat(filePath, function (err, stat) {
        if (stat && stat.isDirectory()) {
          return walk(filePath, action);
        }
        return action(filePath);
      });
    });
  });
}

function walkRelative(dirPath, action) {
  const absPath = resolve(dirPath);
  walk(dirPath, function truncatePath(filePath) {
    // +1 to get the directory separator
    const relativePath = filePath.substring(absPath.length + 1);
    if (!filter || !filter.test(relativePath)) {
      action(relativePath);
    }
  });
}
