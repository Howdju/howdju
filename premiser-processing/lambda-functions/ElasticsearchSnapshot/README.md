# https://www.elastic.co/guide/en/elasticsearch/reference/6.4/modules-snapshots.html

# create repository

# https://www.elastic.co/guide/en/elasticsearch/plugins/current/repository-s3-repository.html

PUT \_snapshot/my_s3_repository
{
"type": "s3",
"settings": {
"bucket": "my_bucket"
"client": "default"
}
}

curl -s -X PUT -H 'Content-Type: application/json' internal-default-private-lb-72407010.us-east-1.elb.amazonaws.com:9200/\_snapshot/test_snapshot_repository -d '{"type":"s3","settings":{"bucket":"howdju-elasticsearch-snapshots","client":"default"}}' | jq .

# create snapshot

# PUT /\_snapshot/my_backup/<snapshot-{now/d}>

PUT /\_snapshot/my_backup/%3Csnapshot-%7Bnow%2Fd%7D%3E

# restore

POST /\_snapshot/my_backup/snapshot_1/\_restore

# restore status

GET /\_snapshot/\_status
GET /\_snapshot/my_backup/\_status
GET /\_snapshot/my_backup/snapshot_1/\_status
