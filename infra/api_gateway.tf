resource "aws_api_gateway_rest_api" "premiser" {
  api_key_source               = "HEADER"
  disable_execute_api_endpoint = false
  minimum_compression_size     = "512"
  name                         = "premiser"
  put_rest_api_mode            = "overwrite"
  endpoint_configuration {
    types = ["EDGE"]
  }
  lifecycle {
    // Recreating the API would change its ID and break the custom domains' base path mappings.
    prevent_destroy = true
    ignore_changes  = [tags_all]
  }
}

resource "aws_api_gateway_resource" "api" {
  parent_id   = aws_api_gateway_rest_api.premiser.root_resource_id
  path_part   = "api"
  rest_api_id = aws_api_gateway_rest_api.premiser.id
}

resource "aws_api_gateway_resource" "api_proxy" {
  parent_id   = aws_api_gateway_resource.api.id
  path_part   = "{proxy+}"
  rest_api_id = aws_api_gateway_rest_api.premiser.id
}

resource "aws_api_gateway_method" "api_proxy_any" {
  api_key_required = false
  authorization    = "NONE"
  http_method      = "ANY"
  request_parameters = {
    "method.request.path.proxy" = true
  }
  resource_id = aws_api_gateway_resource.api_proxy.id
  rest_api_id = aws_api_gateway_rest_api.premiser.id
}

resource "aws_api_gateway_integration" "api_proxy_any" {
  cache_key_parameters    = ["method.request.path.proxy"]
  cache_namespace         = "2u581q"
  connection_type         = "INTERNET"
  content_handling        = "CONVERT_TO_TEXT"
  http_method             = "ANY"
  integration_http_method = "POST"
  passthrough_behavior    = "WHEN_NO_MATCH"
  resource_id             = aws_api_gateway_resource.api_proxy.id
  rest_api_id             = aws_api_gateway_rest_api.premiser.id
  timeout_milliseconds    = 29000
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:007899441171:function:premiserApi:$${stageVariables.lambdaAlias}/invocations"
}

resource "aws_api_gateway_stage" "dev" {
  cache_cluster_enabled = false
  deployment_id         = "7ip5d0"
  rest_api_id           = aws_api_gateway_rest_api.premiser.id
  stage_name            = "dev"
  variables = {
    lambdaAlias = "dev"
    logLevel    = "silly"
  }
  xray_tracing_enabled = false
  lifecycle {
    ignore_changes = [deployment_id, tags_all]
  }
}

resource "aws_api_gateway_stage" "pre_prod" {
  cache_cluster_enabled = false
  deployment_id         = "xcck1p"
  rest_api_id           = aws_api_gateway_rest_api.premiser.id
  stage_name            = "pre_prod"
  variables = {
    lambdaAlias = "pre-prod"
    logLevel    = "silly"
  }
  xray_tracing_enabled = false
  lifecycle {
    ignore_changes = [deployment_id, tags_all]
  }
}

resource "aws_api_gateway_stage" "prod" {
  cache_cluster_enabled = false
  deployment_id         = "xcck1p"
  rest_api_id           = aws_api_gateway_rest_api.premiser.id
  stage_name            = "prod"
  variables = {
    lambdaAlias = "prod"
  }
  xray_tracing_enabled = false
  lifecycle {
    ignore_changes = [deployment_id, tags_all]
  }
}

resource "aws_api_gateway_domain_name" "api_howdju_com" {
  certificate_arn = aws_acm_certificate.howdju.arn
  domain_name     = "api.howdju.com"
  security_policy = "TLS_1_0"
  endpoint_configuration {
    types = ["EDGE"]
  }
  lifecycle {
    ignore_changes = [tags_all]
  }
}

resource "aws_api_gateway_domain_name" "dev_api_howdju_com" {
  certificate_arn = aws_acm_certificate.howdju.arn
  domain_name     = "dev-api.howdju.com"
  security_policy = "TLS_1_0"
  endpoint_configuration {
    types = ["EDGE"]
  }
  lifecycle {
    ignore_changes = [tags_all]
  }
}

resource "aws_api_gateway_domain_name" "pre_prod_api_howdju_com" {
  certificate_arn = aws_acm_certificate.howdju.arn
  domain_name     = "pre-prod-api.howdju.com"
  security_policy = "TLS_1_0"
  endpoint_configuration {
    types = ["EDGE"]
  }
  lifecycle {
    ignore_changes = [tags_all]
  }
}

resource "aws_api_gateway_base_path_mapping" "api_howdju_com" {
  api_id      = aws_api_gateway_rest_api.premiser.id
  domain_name = aws_api_gateway_domain_name.api_howdju_com.domain_name
  stage_name  = aws_api_gateway_stage.prod.stage_name
}

resource "aws_api_gateway_base_path_mapping" "dev_api_howdju_com" {
  api_id      = aws_api_gateway_rest_api.premiser.id
  domain_name = aws_api_gateway_domain_name.dev_api_howdju_com.domain_name
  stage_name  = aws_api_gateway_stage.dev.stage_name
}

resource "aws_api_gateway_base_path_mapping" "pre_prod_api_howdju_com" {
  api_id      = aws_api_gateway_rest_api.premiser.id
  domain_name = aws_api_gateway_domain_name.pre_prod_api_howdju_com.domain_name
  stage_name  = aws_api_gateway_stage.pre_prod.stage_name
}
