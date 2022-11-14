const R = require("ramda");

const hourlySnapshotName = "<snapshot-{now/h{YYYY-MM-dd-HH}}>";
const defaultSnapshotName = hourlySnapshotName;

module.exports.SnapshotsService = class SnapshotsService {
  constructor(elasticsearchClient, s3Bucket, masterTimeout, timeout) {
    this.elasticsearchClient = elasticsearchClient;
    this.s3Bucket = s3Bucket;
    this.masterTimeout = masterTimeout;
    this.timeout = timeout;
  }

  async dispatchEvent(event) {
    switch (event.action) {
      case "createSnapshot":
        return await this.createSnapshot(event);
      case "createRepository":
        return await this.createRepository(event);
      case "deleteSnapshot":
        return await this.deleteSnapshot(event);
      case "deleteRepository":
        return await this.deleteRepository(event);
      case "getSnapshot":
        return await this.getSnapshot(event);
      case "getAllSnapshots":
        return await this.getAllSnapshots(event);
      case "getLatestSnapshot":
        return await this.getLatestSnapshot(event);
      case "getRepository":
        return await this.getRepository(event);
      case "restoreSnapshot":
        return await this.restoreSnapshot(event);
      case "restoreLatestSnapshot":
        return await this.restoreLatestSnapshot(event);
      case "getSnapshotStatus":
        return await this.getSnapshotStatus(event);
      case "getLatestSnapshotStatus":
        return await this.getLatestSnapshotStatus(event);
      case "verifyRepository":
        return await this.verifyRepository(event);
      default:
        throw new Error(`Unsupported action: ${event.action}`);
    }
  }

  async createSnapshot(event) {
    const repositoryName = event.repositoryName;
    if (!repositoryName) throw new Error("repositoryName is required");

    const snapshotName = event.snapshotName || defaultSnapshotName;
    if (!snapshotName) throw new Error("snapshotName is required");

    const indices = event.indices;

    return await this.elasticsearchClient.snapshot.create({
      masterTimeout: this.masterTimeout,
      waitForCompletion: false,
      indices,
      repository: repositoryName,
      snapshot: snapshotName,
    });
  }

  async createRepository(event) {
    const repositoryName = event.repositoryName;
    if (!repositoryName) throw new Error("repositoryName is required");

    const basePath = event.basePath;

    return await this.elasticsearchClient.snapshot.createRepository({
      masterTimeout: this.masterTimeout,
      timeout: this.timeout,
      verify: true,
      repository: repositoryName,
      body: {
        type: "s3",
        settings: {
          bucket: this.s3Bucket,
          base_path: basePath,
        },
      },
    });
  }

  async deleteSnapshot(event) {
    const repositoryName = event.repositoryName;
    const snapshotName = event.snapshotName;
    return await this.elasticsearchClient.snapshot.delete({
      masterTimeout: this.masterTimeout,
      repository: repositoryName,
      snapshot: snapshotName,
    });
  }

  async deleteRepository(event) {
    const repositoryName = event.repositoryName;
    return await this.elasticsearchClient.snapshot.deleteRepository({
      masterTimeout: this.masterTimeout,
      timeout: this.timeout,
      // Accepts multiple repositories
      repository: repositoryName,
    });
  }

  async getSnapshot(event) {
    const repositoryName = event.repositoryName;
    const snapshotName = event.snapshotName;
    return await this.elasticsearchClient.snapshot.get({
      masterTimeout: this.masterTimeout,
      ignoreUnavailable: false,
      verbose: true,
      repository: repositoryName,
      // Accepts multiple snapshots
      snapshot: snapshotName,
    });
  }

  async getAllSnapshots(event) {
    const repositoryName = event.repositoryName;
    return await this.elasticsearchClient.snapshot.get({
      masterTimeout: this.masterTimeout,
      ignoreUnavailable: false,
      verbose: true,
      repository: repositoryName,
      snapshot: "*",
    });
  }

  async getLatestSnapshot(event) {
    const allSnapshotsResult = await this.getAllSnapshots(event);
    return module.exports.latestSnapshot(allSnapshotsResult["snapshots"]);
  }

  async getRepository(event) {
    const repositoryName = event.repositoryName;
    return await this.elasticsearchClient.snapshot.getRepository({
      masterTimeout: this.masterTimeout,
      local: false,
      // Accepts multiple repositories
      repository: repositoryName,
    });
  }

  async restoreSnapshot(event) {
    const repositoryName = event.repositoryName;
    const snapshotName = event.snapshotName;
    return await this.elasticsearchClient.snapshot.restore({
      masterTimeout: this.masterTimeout,
      waitForCompletion: false,
      repository: repositoryName,
      snapshot: snapshotName,
    });
  }

  async restoreLatestSnapshot(event) {
    const latestSnapshot = await this.getLatestSnapshot(event);
    const latestSnapshotName = latestSnapshot["snapshot"];

    const repositoryName = event.repositoryName;
    return await this.elasticsearchClient.snapshot.restore({
      masterTimeout: this.masterTimeout,
      waitForCompletion: false,
      repository: repositoryName,
      snapshot: latestSnapshotName,
    });
  }

  async getLatestSnapshotStatus(event) {
    const latestSnapshot = await this.getLatestSnapshot(event);
    const latestSnapshotName = latestSnapshot["snapshot"];

    const repositoryName = event.repositoryName;
    return await this.elasticsearchClient.snapshot.status({
      masterTimeout: this.masterTimeout,
      ignoreUnavailable: false,
      repository: repositoryName,
      // Accepts multiple snapshots
      snapshot: latestSnapshotName,
    });
  }

  async getSnapshotStatus(event) {
    const repositoryName = event.repositoryName;
    const snapshotName = event.snapshotName;
    return await this.elasticsearchClient.snapshot.status({
      masterTimeout: this.masterTimeout,
      ignoreUnavailable: false,
      repository: repositoryName,
      // Accepts multiple snapshots
      snapshot: snapshotName,
    });
  }

  async verifyRepository(event) {
    const repositoryName = event.repositoryName;
    return await this.elasticsearchClient.snapshot.verifyRepository({
      masterTimeout: this.masterTimeout,
      timeout: this.timeout,
      repository: repositoryName,
    });
  }
};

module.exports.latestSnapshot = R.compose(
  R.last,
  R.sortBy(R.prop("start_time_in_millis"))
);
