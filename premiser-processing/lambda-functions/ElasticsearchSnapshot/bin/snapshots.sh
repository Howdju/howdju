#!/usr/bin/env bash

action=$1

case $action in
  create-repository )
    payload='{"action":"createRepository","repositoryName":"howdju","basePath":"howdju"}'
    ;;
  create )
    snapshotName=$2
    payload='{"action":"createSnapshot","repositoryName":"howdju","snapshotName":"'$snapshotName'"}'
    ;;
  delete-repository )
    payload='{"action":"deleteRepository","repositoryName":"howdju"}'
    ;;
  delete )
    snapshotName=$2
    payload='{"action":"deleteSnapshot","repositoryName":"howdju","snapshotName":"'$snapshotName'"}'
    ;;
  list )
    payload='{"action":"getAllSnapshots","repositoryName":"howdju"}'
    ;;
  latest )
    payload='{"action":"getLatestSnapshot","repositoryName":"howdju"}'
    ;;
  restore )
    snapshotName=$2
    payload='{"action":"restoreSnapshot","repositoryName":"howdju","snapshotName":"'$snapshotName'"}'
    ;;
  restore-latest )
    payload='{"action":"restoreLatestSnapshot","repositoryName":"howdju"}'
    ;;
  status )
    snapshotName=$2
    payload='{"action":"getSnapshotStatus","repositoryName":"howdju","snapshotName":"'$snapshotName'"}'
    ;;
  latest-status )
    payload='{"action":"geLatesttSnapshotStatus","repositoryName":"howdju"}'
    ;;
  *)
     echo invalid action: $action
     exit 1
  ;;
esac

outfile=snapshots.sh.out
aws lambda invoke --function-name ElasticsearchSnapshots \
  --invocation-type RequestResponse \
  --payload $payload \
  --qualifier live \
  --profile premiser \
  --region us-east-1 \
  $outfile
cat $outfile | jq .
rm $outfile
