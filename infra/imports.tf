// Import blocks for resources created outside of Terraform. Safe to delete after they are applied.

// API Gateway
import {
  to = aws_api_gateway_rest_api.premiser
  id = "ewl0mezq3f"
}
import {
  to = aws_api_gateway_resource.api
  id = "ewl0mezq3f/ltc641"
}
import {
  to = aws_api_gateway_resource.api_proxy
  id = "ewl0mezq3f/2u581q"
}
import {
  to = aws_api_gateway_method.api_proxy_any
  id = "ewl0mezq3f/2u581q/ANY"
}
import {
  to = aws_api_gateway_integration.api_proxy_any
  id = "ewl0mezq3f/2u581q/ANY"
}
import {
  to = aws_api_gateway_stage.dev
  id = "ewl0mezq3f/dev"
}
import {
  to = aws_api_gateway_stage.pre_prod
  id = "ewl0mezq3f/pre_prod"
}
import {
  to = aws_api_gateway_stage.prod
  id = "ewl0mezq3f/prod"
}
import {
  to = aws_api_gateway_domain_name.api_howdju_com
  id = "api.howdju.com"
}
import {
  to = aws_api_gateway_base_path_mapping.api_howdju_com
  id = "api.howdju.com/"
}
import {
  to = aws_api_gateway_domain_name.dev_api_howdju_com
  id = "dev-api.howdju.com"
}
import {
  to = aws_api_gateway_base_path_mapping.dev_api_howdju_com
  id = "dev-api.howdju.com/"
}
import {
  to = aws_api_gateway_domain_name.pre_prod_api_howdju_com
  id = "pre-prod-api.howdju.com"
}
import {
  to = aws_api_gateway_base_path_mapping.pre_prod_api_howdju_com
  id = "pre-prod-api.howdju.com/"
}
import {
  to = aws_lambda_permission.premiser_api_from_api_gateway
  id = "premiserApi/5f05f9931f343bf2a26f97277b8ca0fc"
}

// Lambdas
import {
  to = aws_lambda_function.premiser_api
  id = "premiserApi"
}
import {
  to = aws_lambda_alias.premiser_api_dev
  id = "premiserApi/dev"
}
import {
  to = aws_lambda_alias.premiser_api_pre_prod
  id = "premiserApi/pre-prod"
}
import {
  to = aws_lambda_alias.premiser_api_prod
  id = "premiserApi/prod"
}
import {
  to = aws_iam_role.premiser_api
  id = "premiserLambdaRole"
}
import {
  to = aws_iam_role_policy_attachment.premiser_api_awslambdavpcaccessexecutionrole
  id = "premiserLambdaRole/arn:aws:iam::007899441171:policy/service-role/AWSLambdaVPCAccessExecutionRole-a4c18a60-a798-4d08-b2eb-50ec5ca229b6"
}
import {
  to = aws_iam_role_policy_attachment.premiser_api_awslambdabasicexecutionrole
  id = "premiserLambdaRole/arn:aws:iam::007899441171:policy/service-role/AWSLambdaBasicExecutionRole-a648f0a4-fc7b-4ae8-843b-abcd767e8aa0"
}
import {
  to = aws_iam_role_policy_attachment.premiser_api_allowpublishtohowdjumessagestopic
  id = "premiserLambdaRole/arn:aws:iam::007899441171:policy/AllowPublishToHowdjuMessagesTopic"
}
import {
  to = aws_iam_role_policy_attachment.premiser_api_accessdatabaseconnectioninfossmparameters
  id = "premiserLambdaRole/arn:aws:iam::007899441171:policy/AccessDatabaseConnectionInfoSSMParameters"
}
import {
  to = aws_iam_role.score_justifications
  id = "scoreJustificationsLambdaRole"
}
import {
  to = aws_iam_role_policy_attachment.score_justifications_awslambdabasicexecutionrole
  id = "scoreJustificationsLambdaRole/arn:aws:iam::007899441171:policy/service-role/AWSLambdaBasicExecutionRole-83a8dd8a-be1b-4b5b-9cac-8ac642e7f240"
}
import {
  to = aws_iam_role_policy_attachment.score_justifications_awslambdavpcaccessexecutionrole
  id = "scoreJustificationsLambdaRole/arn:aws:iam::007899441171:policy/service-role/AWSLambdaVPCAccessExecutionRole-a4c18a60-a798-4d08-b2eb-50ec5ca229b6"
}
import {
  to = aws_iam_role_policy_attachment.score_justifications_accessdatabaseconnectioninfossmparameters
  id = "scoreJustificationsLambdaRole/arn:aws:iam::007899441171:policy/AccessDatabaseConnectionInfoSSMParameters"
}
import {
  to = aws_iam_role.statement_tag_scorer
  id = "statementTagScorerLambdaRole"
}
import {
  to = aws_iam_role_policy_attachment.statement_tag_scorer_statementtagscorer
  id = "statementTagScorerLambdaRole/arn:aws:iam::007899441171:policy/statementTagScorer-AWSLambdaBasicExecutionRole-201710231758"
}
import {
  to = aws_iam_role_policy_attachment.statement_tag_scorer_awslambdavpcaccessexecutionrole
  id = "statementTagScorerLambdaRole/arn:aws:iam::007899441171:policy/service-role/AWSLambdaVPCAccessExecutionRole-a4c18a60-a798-4d08-b2eb-50ec5ca229b6"
}
import {
  to = aws_iam_role_policy_attachment.statement_tag_scorer_accessdatabaseconnectioninfossmparameters
  id = "statementTagScorerLambdaRole/arn:aws:iam::007899441171:policy/AccessDatabaseConnectionInfoSSMParameters"
}
import {
  to = aws_lambda_function.score_justifications
  id = "scoreJustifications"
}
import {
  to = aws_cloudwatch_event_rule.score_justifications
  id = "scoreJustifications_scheduledRule_prod"
}
import {
  to = aws_cloudwatch_event_target.score_justifications
  id = "scoreJustifications_scheduledRule_prod/rc3da9urtxsdo2bspj3"
}
import {
  to = aws_lambda_permission.score_justifications_from_events
  id = "scoreJustifications/lambda-882e6d96-2897-49af-8a37-a8db3868a574"
}
import {
  to = aws_lambda_function.statement_tag_scorer
  id = "statementTagScorer"
}
import {
  to = aws_cloudwatch_event_rule.statement_tag_scorer
  id = "statementTagScorer_scheduledRule_prod"
}
import {
  to = aws_cloudwatch_event_target.statement_tag_scorer
  id = "statementTagScorer_scheduledRule_prod/boejcsjprq042m28j7ua"
}
import {
  to = aws_lambda_permission.statement_tag_scorer_from_events
  id = "statementTagScorer/lambda-0da1cad2-2d9a-4b9a-9f3d-66887250e4eb"
}

// Database
import {
  to = aws_db_instance.premiser
  id = "premiser"
}
import {
  to = aws_security_group.rds_launch_wizard
  id = "sg-fb5ded84"
}

// Monitoring
import {
  to = aws_sns_topic.api_lambda_notifications
  id = "arn:aws:sns:us-east-1:007899441171:api-lambda-notifications"
}
import {
  to = aws_cloudwatch_metric_alarm.api_gateway_5xxerror_prod
  id = "AWS/ApiGateway 5XXError ApiName=premiser Stage=prod"
}
import {
  to = aws_cloudwatch_metric_alarm.count_apiname_premiser_stage_prod
  id = "AWS/ApiGateway Count ApiName=premiser Stage=prod"
}
import {
  to = aws_cloudwatch_metric_alarm.latency_apiname_premiser_stage_prod
  id = "AWS/ApiGateway Latency ApiName=premiser Stage=prod"
}
import {
  to = aws_cloudwatch_metric_alarm.duration_functionname_premiserapi
  id = "AWS/Lambda Duration FunctionName=premiserApi"
}
import {
  to = aws_cloudwatch_metric_alarm.errors_functionname_howdju_message_handler
  id = "AWS/Lambda Errors FunctionName=howdju-message-handler"
}
import {
  to = aws_cloudwatch_metric_alarm.errors_functionname_premiserapi
  id = "AWS/Lambda Errors FunctionName=premiserApi"
}
import {
  to = aws_cloudwatch_metric_alarm.throttles_functionname_premiserapi
  id = "AWS/Lambda Throttles FunctionName=premiserApi"
}
import {
  to = aws_cloudwatch_metric_alarm.databaseconnections_dbinstanceidentifier_premiser
  id = "AWS/RDS DatabaseConnections DBInstanceIdentifier=premiser"
}

// Web
import {
  to = aws_cloudfront_distribution.www_howdju_com
  id = "E3ALDHFXYJRKKJ"
}
import {
  to = aws_cloudfront_distribution.howdju_com
  id = "EJ6B6SLOKTPPE"
}
import {
  to = aws_cloudfront_distribution.pre_prod_www_howdju_com
  id = "E11GMSE61AJBIL"
}
import {
  to = aws_cloudfront_distribution.cdn_howdju_com
  id = "E67TFBJG2V4FV"
}
import {
  to = aws_cloudfront_distribution.pre_prod_cdn_howdju_com
  id = "E6L294RSCWPZ8"
}
import {
  to = aws_cloudfront_distribution.docs_howdju_com
  id = "ECBMF327IDKRF"
}
import {
  to = aws_s3_bucket.www_howdju_com
  id = "www.howdju.com"
}
import {
  to = aws_s3_bucket_website_configuration.www_howdju_com
  id = "www.howdju.com"
}
import {
  to = aws_s3_bucket_policy.www_howdju_com
  id = "www.howdju.com"
}
import {
  to = aws_s3_bucket.howdju_com
  id = "howdju.com"
}
import {
  to = aws_s3_bucket_website_configuration.howdju_com
  id = "howdju.com"
}
import {
  to = aws_s3_bucket.pre_prod_www_howdju_com
  id = "pre-prod-www.howdju.com"
}
import {
  to = aws_s3_bucket_website_configuration.pre_prod_www_howdju_com
  id = "pre-prod-www.howdju.com"
}
import {
  to = aws_s3_bucket_policy.pre_prod_www_howdju_com
  id = "pre-prod-www.howdju.com"
}
import {
  to = aws_s3_bucket.cdn_howdju_com
  id = "cdn.howdju.com"
}
import {
  to = aws_s3_bucket_policy.cdn_howdju_com
  id = "cdn.howdju.com"
}
import {
  to = aws_s3_bucket.pre_prod_cdn_howdju_com
  id = "pre-prod-cdn.howdju.com"
}
import {
  to = aws_s3_bucket_policy.pre_prod_cdn_howdju_com
  id = "pre-prod-cdn.howdju.com"
}
import {
  to = aws_s3_bucket.docs_howdju_com
  id = "docs.howdju.com"
}
import {
  to = aws_s3_bucket_website_configuration.docs_howdju_com
  id = "docs.howdju.com"
}
import {
  to = aws_s3_bucket_policy.docs_howdju_com
  id = "docs.howdju.com"
}
import {
  to = aws_s3_bucket.howdju_log_export
  id = "howdju-log-export"
}
import {
  to = aws_s3_bucket_policy.howdju_log_export
  id = "howdju-log-export"
}
import {
  to = aws_acm_certificate.howdju
  id = "arn:aws:acm:us-east-1:007899441171:certificate/a059f47b-bf89-4fe6-8e41-d6da04bba7ee"
}
import {
  to = aws_acm_certificate.docs_howdju
  id = "arn:aws:acm:us-east-1:007899441171:certificate/16468539-cded-4246-bc90-8942e7e52993"
}

// DNS (howdju.com)
import {
  to = aws_route53_record.apex_a
  id = "Z1WS1MHFSDZJV1_howdju.com_A"
}
import {
  to = aws_route53_record.apex_mx
  id = "Z1WS1MHFSDZJV1_howdju.com_MX"
}
import {
  to = aws_route53_record.apex_txt
  id = "Z1WS1MHFSDZJV1_howdju.com_TXT"
}
import {
  to = aws_route53_record.amazonses_txt
  id = "Z1WS1MHFSDZJV1__amazonses.howdju.com_TXT"
}
import {
  to = aws_route53_record.dcb31f88562438c981e44f929d8c5cd3_cname
  id = "Z1WS1MHFSDZJV1__dcb31f88562438c981e44f929d8c5cd3.howdju.com_CNAME"
}
import {
  to = aws_route53_record.ses_dkim_6aczssebmxrzudwkkcndjchw5gta4mm7_cname
  id = "Z1WS1MHFSDZJV1_6aczssebmxrzudwkkcndjchw5gta4mm7._domainkey.howdju.com_CNAME"
}
import {
  to = aws_route53_record.cdcv4pktv2fzkf7l5iza5zivr6u24bvg_domainkey_cname
  id = "Z1WS1MHFSDZJV1_cdcv4pktv2fzkf7l5iza5zivr6u24bvg._domainkey.howdju.com_CNAME"
}
import {
  to = aws_route53_record.google_domainkey_txt
  id = "Z1WS1MHFSDZJV1_google._domainkey.howdju.com_TXT"
}
import {
  to = aws_route53_record.q5adni73p7azafnidxmazkjjtigo25dq_domainkey_cname
  id = "Z1WS1MHFSDZJV1_q5adni73p7azafnidxmazkjjtigo25dq._domainkey.howdju.com_CNAME"
}
import {
  to = aws_route53_record.github_challenge_howdju_org_txt
  id = "Z1WS1MHFSDZJV1__github-challenge-howdju-org.howdju.com_TXT"
}
import {
  to = aws_route53_record.api_cname
  id = "Z1WS1MHFSDZJV1_api.howdju.com_CNAME"
}
import {
  to = aws_route53_record.cal_cname
  id = "Z1WS1MHFSDZJV1_cal.howdju.com_CNAME"
}
import {
  to = aws_route53_record.cdn_cname
  id = "Z1WS1MHFSDZJV1_cdn.howdju.com_CNAME"
}
import {
  to = aws_route53_record.dev_api_cname
  id = "Z1WS1MHFSDZJV1_dev-api.howdju.com_CNAME"
}
import {
  to = aws_route53_record.docs_cname
  id = "Z1WS1MHFSDZJV1_docs.howdju.com_CNAME"
}
import {
  to = aws_route53_record.docs_acm_validation_cname
  id = "Z1WS1MHFSDZJV1__76280c04f038e2523c6ba214ec801839.docs.howdju.com_CNAME"
}
import {
  to = aws_route53_record.mail_cname
  id = "Z1WS1MHFSDZJV1_mail.howdju.com_CNAME"
}
import {
  to = aws_route53_record.notifications_mx
  id = "Z1WS1MHFSDZJV1_notifications.howdju.com_MX"
}
import {
  to = aws_route53_record.notifications_txt
  id = "Z1WS1MHFSDZJV1_notifications.howdju.com_TXT"
}
import {
  to = aws_route53_record.pre_prod_api_cname
  id = "Z1WS1MHFSDZJV1_pre-prod-api.howdju.com_CNAME"
}
import {
  to = aws_route53_record.pre_prod_cdn_cname
  id = "Z1WS1MHFSDZJV1_pre-prod-cdn.howdju.com_CNAME"
}
import {
  to = aws_route53_record.pre_prod_www_cname
  id = "Z1WS1MHFSDZJV1_pre-prod-www.howdju.com_CNAME"
}
import {
  to = aws_route53_record.www_cname
  id = "Z1WS1MHFSDZJV1_www.howdju.com_CNAME"
}
