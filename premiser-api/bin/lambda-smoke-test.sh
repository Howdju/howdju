region=$1
lambda_name=$2
payload=$3

log_file_name=lambda-smoke-test.json
response_file_name=lambda-smoke-test-invoke-response.json

aws lambda invoke \
  --invocation-type RequestResponse \
  --function-name $lambda_name \
  --region $region \
  --log-type Tail \
  --payload $payload \
  --profile premiser \
  $response_file_name \
  > $log_file_name
cat $log_file_name | jq '.LogResult | @base64d'
cat $response_file_name
status_code=$(cat $response_file_name | jq '.statusCode')
[[ $status_code -ne '500' ]]
