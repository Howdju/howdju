region=$1
lambda_name=$2
payload=$3

aws lambda invoke \
  --invocation-type RequestResponse \
  --function-name $lambda_name \
  --region $region \
  --log-type Tail \
  --payload $payload \
  --profile premiser \
  lambda-invoke-response.txt
cat lambda-invoke-response.txt
grep lambda-invoke-response.txt Error && exit 1