const Promise = require("bluebird");
const zlib = Promise.promisifyAll(require("zlib"));

const logger = require("./logger");

const unexpectedTokenRegExp =
  /SyntaxError: Unexpected token (.+) in JSON at position (\d+)/;
const contextLines = 20;
module.exports.extract = async function extract(event) {
  const data = new Buffer(event.awslogs.data, "base64");
  const unzippedData = await zlib.gunzipAsync(data);
  const text = unzippedData
    .toString("ascii")
    // For some reason odd characters can appear in the data
    .replace(/[\u{0000}-\u{0008}\u{000b}-\u{000c}\u{000e}-\u{001f}]/gu, "");
  try {
    return JSON.parse(text);
  } catch (err) {
    const match = unexpectedTokenRegExp.exec(text);
    if (match) {
      const token = match[1];
      const position = parseInt(match[2]);
      const offendingContext = text.substring(
        position - contextLines,
        position + contextLines
      );
      logger.error(
        `Invalid JSON (${token}) at ${contextLines}: ${offendingContext}`
      );
    } else {
      logger.error(`Invalid JSON: ${text}`);
    }
    throw err;
  }
};

const startPhaseRegExp = /^START RequestId: ([\w-]+) Version: (\d+)\s*$/;
const endPhaseRegExp = /^END RequestId: ([\w-]+)\s*$/;
const reportPhaseRegExp =
  /^REPORT RequestId: ([\w-]+)\s+Duration: ([\d.]+) ms\s+Billed Duration: ([\d.]+) ms\s+Memory Size: (\d+) MB\s+Max Memory Used: (\d+) MB\s*$/;
/**
 * Transforms log events into documents for indexing in Elasticsearch
 *
 * Example logEventMessages:
 *   START RequestId: d0d91210-b21e-11e8-95bb-83bf50174482 Version: 82
 *   END RequestId: ca222bf8-b21e-11e8-b5df-ff6854f2bd22
 *   REPORT RequestId: d0d91210-b21e-11e8-95bb-83bf50174482	Duration: 541.47 ms	Billed Duration: 600 ms Memory Size: 128 MB	Max Memory Used: 56 MB
 *   REPORT RequestId: 1df3b8c2-b2fa-11e8-abaa-ab0a555645d0	Duration: 120056.60 ms	Billed Duration: 120000 ms 	Memory Size: 1088 MB	Max Memory Used: 20 MB
 *   {"timestamp":"2018-09-06T21:50:06.267Z","context":{"clientRequestId":"6b8431d4-3980-4d2f-b1f6-035ff14bc96a","serverRequestId":"d0d8763a-b21e-11e8-beb0-a9b0cd0989a5","stage":"pre_prod"},"level":"silly","levelNumber":5,"message":"Response","data":{...}}}
 * @param logEvent
 * @param logGroupName
 * @param logStreamName
 * @returns {{logGroupName: *, logStreamName: *, logEventId: *, logEventTimestamp: *, logEventMessage: *, lambdaFunctionPhase: *, lambdaFunctionVersion: *, lambdaFunctionDurationMs: *, lambdaFunctionBilledDurationMs: *, lambdaFunctionMemorySizeMb: *, lambdaFunctionMaxMemoryUsedMb: *, timestamp: *, clientRequestId: *, serverRequestId: *, stage: *, logLevel: *, logLevelNumber: *, message: *, data: *, ingestTimestamp: string}}
 */
module.exports.logEventToDocument = function logEventToDocument(
  logEvent,
  logGroupName,
  logStreamName
) {
  const logEventMessage = logEvent.message;
  let lambdaFunctionPhase;
  let lambdaFunctionVersion;
  let lambdaFunctionDurationMs;
  let lambdaFunctionBilledDurationMs;
  let lambdaFunctionMemorySizeMb;
  let lambdaFunctionMaxMemoryUsedMb;
  let timestamp;
  let clientRequestId;
  let serverRequestId;
  let stage;
  let logLevel;
  let logLevelNumber;
  let message;
  let data;

  let matches;
  if ((matches = startPhaseRegExp.exec(logEventMessage))) {
    lambdaFunctionPhase = "START";
    serverRequestId = matches[1];
    lambdaFunctionVersion = matches[2];
  } else if ((matches = endPhaseRegExp.exec(logEventMessage))) {
    lambdaFunctionPhase = "END";
    serverRequestId = matches[1];
  } else if ((matches = reportPhaseRegExp.exec(logEventMessage))) {
    lambdaFunctionPhase = "REPORT";
    serverRequestId = matches[1];
    lambdaFunctionDurationMs = parseFloat(matches[2]);
    lambdaFunctionBilledDurationMs = parseFloat(matches[3]);
    lambdaFunctionMemorySizeMb = parseInt(matches[4]);
    lambdaFunctionMaxMemoryUsedMb = parseInt(matches[5]);
  } else {
    let logEventMessageObj;
    try {
      logEventMessageObj = JSON.parse(logEventMessage);

      timestamp = logEventMessageObj.timestamp;
      const context = logEventMessageObj.context;
      if (context) {
        clientRequestId = context.clientRequestId;
        serverRequestId = context.serverRequestId;
        stage = context.stage;
      }
      logLevel = logEventMessageObj.level;
      logLevelNumber = logEventMessageObj.levelNumber;
      message = logEventMessageObj.message;
      data = logEventMessageObj.data;
    } catch (err) {
      logger.error(`Unexpected logEventMessage: "${logEventMessage}"`, err);
    }
  }
  return {
    logGroupName,
    logStreamName,
    logEventId: logEvent.id,
    logEventTimestamp: logEvent.timestamp,
    logEventMessage,
    lambdaFunctionPhase,
    lambdaFunctionVersion,
    lambdaFunctionDurationMs,
    lambdaFunctionBilledDurationMs,
    lambdaFunctionMemorySizeMb,
    lambdaFunctionMaxMemoryUsedMb,
    timestamp,
    clientRequestId,
    serverRequestId,
    stage,
    logLevel,
    logLevelNumber,
    message,
    data,
    ingestTimestamp: new Date().toISOString(),
  };
};

module.exports.indexDocuments = async function indexDocuments(
  parsedEvents,
  client,
  index,
  type,
  timeout
) {
  // https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html
  const bulkRecords = [];
  for (const event of parsedEvents) {
    bulkRecords.push({
      index: { _index: index, _type: type, _id: event.requestId },
    });
    bulkRecords.push(event);
  }
  const response = await client.bulk({
    body: bulkRecords,
    timeout,
  });
  return logResponse(response);
};

function logResponse(response) {
  let successCount;
  if (!response.errors) {
    successCount = response.items.length;
    logger.debug(`Successfully indexed all ${successCount} log events`);
  } else {
    const failures = extractResponseFailures(response.items);
    successCount = response.items.length - failures.length;
    logger.error(
      `Successfully logged only ${successCount} out of ${response.items.length} log events.` +
        `  Failures: ${JSON.stringify(failures)}`
    );
  }
  return successCount;
}

const actionTypeNames = ["index", "create", "update", "delete"];
function extractResponseFailures(responseItems) {
  const failures = [];
  for (const responseItem of responseItems) {
    let actionTypeName = null;
    let actionResult = null;
    for (const name of actionTypeNames) {
      const result = responseItem[name];
      if (result) {
        actionTypeName = name;
        actionResult = result;
        break;
      }
    }
    if (!actionResult) {
      throw new Error(
        `Elasticsearch bulk response item lacks expected property: ${JSON.stringify(
          responseItem
        )}`
      );
    }

    const shards = actionResult["_shards"];
    if (!shards) {
      logger.warn(
        `Elasticsearch bulk response action result lacks _shards property: ${JSON.stringify(
          actionResult
        )}`
      );
    } else if (shards["failed"] > 0) {
      failures.push({ [actionTypeName]: actionResult });
    }
  }
  return failures;
}
