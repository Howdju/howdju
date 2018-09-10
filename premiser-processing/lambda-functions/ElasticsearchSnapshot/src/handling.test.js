const {latestSnapshot} = require('./snapshots-service')

describe('handling', () => {
  describe('latestSnapshot', () => {
    const earlierSnapshot = {
      "snapshot": "snapshot-2018.09.09",
      "uuid": "MZHgcM4BT0anvcbqQv-wTA",
      "version_id": 6040099,
      "version": "6.4.0",
      "indices": [
        ".kibana",
        "logs"
      ],
      "include_global_state": true,
      "state": "SUCCESS",
      "start_time": "2018-09-09T21:11:50.782Z",
      "start_time_in_millis": 1536527510782,
      "end_time": "2018-09-09T21:11:55.949Z",
      "end_time_in_millis": 1536527515949,
      "duration_in_millis": 5167,
      "failures": [],
      "shards": {
        "total": 6,
        "failed": 0,
        "successful": 6
      }
    }
    const middleSnapshot = {
      "snapshot": "test_snapshot1",
      "uuid": "xCXUbHmrTK2QbwOe_pyMxQ",
      "version_id": 6040099,
      "version": "6.4.0",
      "indices": [
        ".kibana",
        "logs"
      ],
      "include_global_state": true,
      "state": "SUCCESS",
      "start_time": "2018-09-09T21:12:15.131Z",
      "start_time_in_millis": 1536527595131,
      "end_time": "2018-09-09T21:13:16.439Z",
      "end_time_in_millis": 1536527596439,
      "duration_in_millis": 1308,
      "failures": [],
      "shards": {
        "total": 6,
        "failed": 0,
        "successful": 6
      }
    }
    const laterSnapshot = {
      "snapshot": "test_snapshot2",
      "uuid": "xCXUbHmrTK2QbwOe_pyMxQ",
      "version_id": 6040099,
      "version": "6.4.0",
      "indices": [
        ".kibana",
        "logs"
      ],
      "include_global_state": true,
      "state": "SUCCESS",
      "start_time": "2018-09-09T21:13:15.131Z",
      "start_time_in_millis": 1536527695131,
      "end_time": "2018-09-09T21:13:16.439Z",
      "end_time_in_millis": 1536527596439,
      "duration_in_millis": 1308,
      "failures": [],
      "shards": {
        "total": 6,
        "failed": 0,
        "successful": 6
      }
    }
    const snapshots = [
      earlierSnapshot,
      laterSnapshot,
      middleSnapshot,
    ]
    test('should get latest snapshot', () => {
      expect(latestSnapshot(snapshots)).toBe(laterSnapshot)
    })
  })
})