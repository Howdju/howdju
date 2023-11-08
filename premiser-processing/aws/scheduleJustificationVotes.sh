#!/usr/bin/env bash

aws events put-rule \
  --name scoreJustifications_scheduledRule_prod_2 \
  --schedule-expression 'rate(5 minutes)' \
  --profile premiser \
  --region us-east-1
aws lambda add-permission \
  --function-name arn:aws:lambda:us-east-1:007899441171:function:scoreJustifications:prod \
  --statement-id my-scheduled-event \
  --action 'lambda:InvokeFunction' \
  --principal events.amazonaws.com \
  --source-arn arn:aws:events:us-east-1:007899441171:rule/scoreJustifications_scheduledRule_prod_2 \
  --profile premiser \
  --region us-east-1
aws events put-targets \
  --rule scoreJustifications_scheduledRule_prod_2 \
  --targets file://aws/scoreJustifications_prod_targets.json  \
  --profile premiser \
  --region us-east-1
