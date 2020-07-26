#!/usr/bin/env bash

set -e

region=$1
lambda_name=$2
payload=$3

cli_response_file_name=lambda-smoke-test-out.json
lambda_response_file_name=lambda-smoke-test-invoke-response.json

aws lambda invoke \
  --invocation-type RequestResponse \
  --function-name $lambda_name \
  --region $region \
  --log-type Tail \
  --payload $payload \
  --profile ${AWS_PROFILE:-BuildTools} \
  $lambda_response_file_name \
  > $cli_response_file_name
cat $cli_response_file_name | jq -r .LogResult | openssl base64 -d -A
# cat $lambda_response_file_name
status_code=$(cat $lambda_response_file_name | jq '.statusCode')
rm $lambda_response_file_name
rm $cli_response_file_name
echo "smoke test status code: $status_code"
# It might be 400, e.g., for some fake login, but we would just like to make sure the server doesn't 500 on us.
[[ $status_code -lt '500' ]]
