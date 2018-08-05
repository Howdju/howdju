region=$1
lambda_name=$2
payload=$3

respons_file_name=lambda-smoke-test-invoke-response.txt

aws lambda invoke \
  --invocation-type RequestResponse \
  --function-name $lambda_name \
  --region $region \
  --log-type Tail \
  --payload $payload \
  --profile premiser \
  $respons_file_name
cat $respons_file_name
grep '"statusCode":500' $respons_file_name && exit 1
exit 0