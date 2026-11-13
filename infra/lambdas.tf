resource "aws_iam_role" "premiser_api" {
  assume_role_policy = jsonencode({
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
    Version = "2012-10-17"
  })
  force_detach_policies = false
  max_session_duration  = 3600
  name                  = "premiserLambdaRole"
  path                  = "/service-role/"
  lifecycle {
    ignore_changes = [tags_all]
  }
}

resource "aws_iam_role" "score_justifications" {
  assume_role_policy = jsonencode({
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
    Version = "2012-10-17"
  })
  force_detach_policies = false
  max_session_duration  = 3600
  name                  = "scoreJustificationsLambdaRole"
  path                  = "/service-role/"
  lifecycle {
    ignore_changes = [tags_all]
  }
}

resource "aws_iam_role" "statement_tag_scorer" {
  assume_role_policy = jsonencode({
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
    Version = "2012-10-17"
  })
  force_detach_policies = false
  max_session_duration  = 3600
  name                  = "statementTagScorerLambdaRole"
  path                  = "/"
  lifecycle {
    ignore_changes = [tags_all]
  }
}

resource "aws_iam_role_policy_attachment" "premiser_api_accessdatabaseconnectioninfossmparameters" {
  policy_arn = "arn:aws:iam::007899441171:policy/AccessDatabaseConnectionInfoSSMParameters"
  role       = aws_iam_role.premiser_api.name
}

resource "aws_iam_role_policy_attachment" "premiser_api_allowpublishtohowdjumessagestopic" {
  policy_arn = "arn:aws:iam::007899441171:policy/AllowPublishToHowdjuMessagesTopic"
  role       = aws_iam_role.premiser_api.name
}

resource "aws_iam_role_policy_attachment" "premiser_api_awslambdabasicexecutionrole" {
  policy_arn = "arn:aws:iam::007899441171:policy/service-role/AWSLambdaBasicExecutionRole-a648f0a4-fc7b-4ae8-843b-abcd767e8aa0"
  role       = aws_iam_role.premiser_api.name
}

resource "aws_iam_role_policy_attachment" "premiser_api_awslambdavpcaccessexecutionrole" {
  policy_arn = "arn:aws:iam::007899441171:policy/service-role/AWSLambdaVPCAccessExecutionRole-a4c18a60-a798-4d08-b2eb-50ec5ca229b6"
  role       = aws_iam_role.premiser_api.name
}

resource "aws_iam_role_policy_attachment" "score_justifications_accessdatabaseconnectioninfossmparameters" {
  policy_arn = "arn:aws:iam::007899441171:policy/AccessDatabaseConnectionInfoSSMParameters"
  role       = aws_iam_role.score_justifications.name
}

resource "aws_iam_role_policy_attachment" "score_justifications_awslambdabasicexecutionrole" {
  policy_arn = "arn:aws:iam::007899441171:policy/service-role/AWSLambdaBasicExecutionRole-83a8dd8a-be1b-4b5b-9cac-8ac642e7f240"
  role       = aws_iam_role.score_justifications.name
}

resource "aws_iam_role_policy_attachment" "score_justifications_awslambdavpcaccessexecutionrole" {
  policy_arn = "arn:aws:iam::007899441171:policy/service-role/AWSLambdaVPCAccessExecutionRole-a4c18a60-a798-4d08-b2eb-50ec5ca229b6"
  role       = aws_iam_role.score_justifications.name
}

resource "aws_iam_role_policy_attachment" "statement_tag_scorer_accessdatabaseconnectioninfossmparameters" {
  policy_arn = "arn:aws:iam::007899441171:policy/AccessDatabaseConnectionInfoSSMParameters"
  role       = aws_iam_role.statement_tag_scorer.name
}

resource "aws_iam_role_policy_attachment" "statement_tag_scorer_awslambdavpcaccessexecutionrole" {
  policy_arn = "arn:aws:iam::007899441171:policy/service-role/AWSLambdaVPCAccessExecutionRole-a4c18a60-a798-4d08-b2eb-50ec5ca229b6"
  role       = aws_iam_role.statement_tag_scorer.name
}

resource "aws_iam_role_policy_attachment" "statement_tag_scorer_statementtagscorer" {
  policy_arn = "arn:aws:iam::007899441171:policy/statementTagScorer-AWSLambdaBasicExecutionRole-201710231758"
  role       = aws_iam_role.statement_tag_scorer.name
}

resource "aws_lambda_function" "premiser_api" {
  # Code is deployed out of band (howdju-ops/lib/lambda.js); this placeholder satisfies validation.
  filename                       = "placeholder.zip"
  architectures                  = ["x86_64"]
  function_name                  = "premiserApi"
  handler                        = "index.handler"
  memory_size                    = 512
  package_type                   = "Zip"
  reserved_concurrent_executions = 50
  role                           = aws_iam_role.premiser_api.arn
  runtime                        = "nodejs18.x"
  skip_destroy                   = false
  timeout                        = 30
  environment {
    variables = {
      API_HOST               = "api.howdju.com"
      API_HOST__PRE_PROD     = "pre-prod-api.howdju.com"
      AWS_SES_ENDPOINT       = "vpce-01b5e57da1ef4cc42-ceqddn8p.email-smtp.us-east-1.vpce.amazonaws.com"
      DEFAULT_AWS_REGION     = "us-east-1"
      IS_AWS                 = "true"
      LOG_LEVEL              = "silly"
      MESSAGES_TOPIC_ARN     = "arn:aws:sns:us-east-1:007899441171:howdju-messages"
      NODE_ENV               = "production"
      UI_AUTHORITY           = "https://www.howdju.com"
      UI_AUTHORITY__PRE_PROD = "https://pre-prod-www.howdju.com"
    }
  }
  ephemeral_storage {
    size = 512
  }
  logging_config {
    log_format = "Text"
    log_group  = "/aws/lambda/premiserApi"
  }
  tracing_config {
    mode = "PassThrough"
  }
  vpc_config {
    ipv6_allowed_for_dual_stack = false
    security_group_ids          = [aws_default_security_group.default.id]
    subnet_ids                  = [data.aws_subnet.default_private_subnet_b.id]
  }
  lifecycle {
    // Destroying the function would delete all published versions, including the one prod runs.
    prevent_destroy = true
    ignore_changes  = [filename, source_code_hash, publish, tags_all]
  }
}

// scoreJustifications (nodejs6.10) is intentionally not imported: its environment contains a plaintext
// DB_PASSWORD, which the provider would print on every plan. Import it after the password is rotated
// and moved to SSM.
locals {
  score_justifications_function_name = "scoreJustifications"
  score_justifications_function_arn  = "arn:aws:lambda:${var.aws_region}:${data.aws_caller_identity.current.account_id}:function:scoreJustifications"
}

resource "aws_lambda_function" "statement_tag_scorer" {
  # Code is deployed out of band (howdju-ops/lib/lambda.js); this placeholder satisfies validation.
  filename                       = "placeholder.zip"
  architectures                  = ["x86_64"]
  description                    = "Scores proposition tag votes"
  function_name                  = "statementTagScorer"
  handler                        = "index.handler"
  memory_size                    = 256
  package_type                   = "Zip"
  reserved_concurrent_executions = -1
  role                           = aws_iam_role.statement_tag_scorer.arn
  runtime                        = "nodejs18.x"
  skip_destroy                   = false
  timeout                        = 600
  environment {
    variables = {
      IS_AWS    = "true"
      LOG_LEVEL = "silly"
      NODE_ENV  = "production"
    }
  }
  ephemeral_storage {
    size = 512
  }
  logging_config {
    log_format = "Text"
    log_group  = "/aws/lambda/statementTagScorer"
  }
  tracing_config {
    mode = "PassThrough"
  }
  vpc_config {
    ipv6_allowed_for_dual_stack = false
    security_group_ids          = [aws_default_security_group.default.id]
    subnet_ids                  = [data.aws_subnet.default_private_subnet_b.id]
  }
  lifecycle {
    ignore_changes = [filename, source_code_hash, publish, tags_all]
  }
}

resource "aws_lambda_alias" "premiser_api_dev" {
  function_name    = aws_lambda_function.premiser_api.function_name
  function_version = "$LATEST"
  name             = "dev"
  lifecycle {
    ignore_changes = [function_version]
  }
}

resource "aws_lambda_alias" "premiser_api_pre_prod" {
  function_name    = aws_lambda_function.premiser_api.function_name
  function_version = "6916"
  name             = "pre-prod"
  lifecycle {
    ignore_changes = [function_version]
  }
}

resource "aws_lambda_alias" "premiser_api_prod" {
  function_name    = aws_lambda_function.premiser_api.function_name
  function_version = "6629"
  name             = "prod"
  lifecycle {
    ignore_changes = [function_version]
  }
}

resource "aws_lambda_permission" "premiser_api_from_api_gateway" {
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.premiser_api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.premiser.execution_arn}/*/*/api/*"
  statement_id  = "5f05f9931f343bf2a26f97277b8ca0fc"
}

resource "aws_lambda_permission" "score_justifications_from_events" {
  action        = "lambda:InvokeFunction"
  function_name = local.score_justifications_function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.score_justifications.arn
  statement_id  = "lambda-882e6d96-2897-49af-8a37-a8db3868a574"
}

resource "aws_lambda_permission" "statement_tag_scorer_from_events" {
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.statement_tag_scorer.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.statement_tag_scorer.arn
  statement_id  = "lambda-0da1cad2-2d9a-4b9a-9f3d-66887250e4eb"
}

resource "aws_cloudwatch_event_rule" "score_justifications" {
  event_bus_name      = "default"
  force_destroy       = false
  name                = "scoreJustifications_scheduledRule_prod"
  schedule_expression = "rate(5 minutes)"
  state               = "ENABLED"
  lifecycle {
    ignore_changes = [tags_all]
  }
}

resource "aws_cloudwatch_event_rule" "statement_tag_scorer" {
  event_bus_name      = "default"
  force_destroy       = false
  name                = "statementTagScorer_scheduledRule_prod"
  schedule_expression = "rate(5 minutes)"
  state               = "ENABLED"
  lifecycle {
    ignore_changes = [tags_all]
  }
}

resource "aws_cloudwatch_event_target" "score_justifications" {
  arn            = local.score_justifications_function_arn
  event_bus_name = "default"
  force_destroy  = false
  rule           = aws_cloudwatch_event_rule.score_justifications.name
  target_id      = "rc3da9urtxsdo2bspj3"
}

resource "aws_cloudwatch_event_target" "statement_tag_scorer" {
  arn            = aws_lambda_function.statement_tag_scorer.arn
  event_bus_name = "default"
  force_destroy  = false
  rule           = aws_cloudwatch_event_rule.statement_tag_scorer.name
  target_id      = "boejcsjprq042m28j7ua"
}
