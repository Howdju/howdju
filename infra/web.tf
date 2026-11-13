resource "aws_acm_certificate" "docs_howdju" {
  domain_name               = "docs.howdju.com"
  key_algorithm             = "RSA_2048"
  subject_alternative_names = ["docs.howdju.com"]
  validation_method         = "DNS"
  options {
    certificate_transparency_logging_preference = "ENABLED"
  }
  lifecycle {
    ignore_changes = [tags_all]
  }
}

resource "aws_acm_certificate" "howdju" {
  domain_name               = "howdju.com"
  key_algorithm             = "RSA_2048"
  subject_alternative_names = ["*.howdju.com", "howdju.com"]
  tags = {
    Name = "howdju cert"
  }
  validation_method = "DNS"
  options {
    certificate_transparency_logging_preference = "ENABLED"
  }
  lifecycle {
    ignore_changes = [tags_all]
  }
}

resource "aws_s3_bucket" "cdn_howdju_com" {
  bucket              = "cdn.howdju.com"
  object_lock_enabled = false
  lifecycle {
    ignore_changes = [tags_all, force_destroy]
  }
}

resource "aws_s3_bucket" "docs_howdju_com" {
  bucket              = "docs.howdju.com"
  object_lock_enabled = false
  lifecycle {
    prevent_destroy = true
    ignore_changes  = [tags_all, force_destroy]
  }
}

resource "aws_s3_bucket" "howdju_com" {
  bucket              = "howdju.com"
  object_lock_enabled = false
  lifecycle {
    ignore_changes = [tags_all, force_destroy]
  }
}

resource "aws_s3_bucket" "howdju_log_export" {
  bucket              = "howdju-log-export"
  object_lock_enabled = false
  lifecycle {
    ignore_changes = [tags_all, force_destroy]
  }
}

resource "aws_s3_bucket" "pre_prod_cdn_howdju_com" {
  bucket              = "pre-prod-cdn.howdju.com"
  object_lock_enabled = false
  lifecycle {
    ignore_changes = [tags_all, force_destroy]
  }
}

resource "aws_s3_bucket" "pre_prod_www_howdju_com" {
  bucket              = "pre-prod-www.howdju.com"
  object_lock_enabled = false
  lifecycle {
    prevent_destroy = true
    ignore_changes  = [tags_all, force_destroy]
  }
}

resource "aws_s3_bucket" "www_howdju_com" {
  bucket              = "www.howdju.com"
  object_lock_enabled = false
  lifecycle {
    prevent_destroy = true
    ignore_changes  = [tags_all, force_destroy]
  }
}

resource "aws_s3_bucket_website_configuration" "docs_howdju_com" {
  bucket = aws_s3_bucket.docs_howdju_com.id
  error_document {
    key = "index.html"
  }
  index_document {
    suffix = "index.html"
  }
}

resource "aws_s3_bucket_website_configuration" "howdju_com" {
  bucket = aws_s3_bucket.howdju_com.id
  redirect_all_requests_to {
    host_name = "www.howdju.com"
    protocol  = "https"
  }
}

resource "aws_s3_bucket_website_configuration" "pre_prod_www_howdju_com" {
  bucket = aws_s3_bucket.pre_prod_www_howdju_com.id
  error_document {
    key = "error.html"
  }
  index_document {
    suffix = "index.html"
  }
}

resource "aws_s3_bucket_website_configuration" "www_howdju_com" {
  bucket = aws_s3_bucket.www_howdju_com.id
  error_document {
    key = "error.html"
  }
  index_document {
    suffix = "index.html"
  }
}

resource "aws_s3_bucket_policy" "cdn_howdju_com" {
  bucket = aws_s3_bucket.cdn_howdju_com.id
  policy = jsonencode({
    Statement = [{
      Action    = "s3:GetObject"
      Effect    = "Allow"
      Principal = "*"
      Resource  = "arn:aws:s3:::cdn.howdju.com/*"
      Sid       = "PublicReadGetObject"
    }]
    Version = "2012-10-17"
  })
}

resource "aws_s3_bucket_policy" "docs_howdju_com" {
  bucket = aws_s3_bucket.docs_howdju_com.id
  policy = jsonencode({
    Statement = [{
      Action    = "s3:GetObject"
      Effect    = "Allow"
      Principal = "*"
      Resource  = "arn:aws:s3:::docs.howdju.com/*"
      Sid       = "PublicReadGetObject"
    }]
    Version = "2012-10-17"
  })
}

resource "aws_s3_bucket_policy" "howdju_log_export" {
  bucket = aws_s3_bucket.howdju_log_export.id
  policy = jsonencode({
    Statement = [{
      Action = "s3:GetBucketAcl"
      Effect = "Allow"
      Principal = {
        Service = "logs.us-east-1.amazonaws.com"
      }
      Resource = "arn:aws:s3:::howdju-log-export"
      }, {
      Action = "s3:PutObject"
      Condition = {
        StringEquals = {
          "s3:x-amz-acl" = "bucket-owner-full-control"
        }
      }
      Effect = "Allow"
      Principal = {
        Service = "logs.us-east-1.amazonaws.com"
      }
      Resource = "arn:aws:s3:::howdju-log-export/20180804-1/*"
    }]
    Version = "2012-10-17"
  })
}

resource "aws_s3_bucket_policy" "pre_prod_cdn_howdju_com" {
  bucket = aws_s3_bucket.pre_prod_cdn_howdju_com.id
  policy = jsonencode({
    Statement = [{
      Action    = "s3:GetObject"
      Effect    = "Allow"
      Principal = "*"
      Resource  = "arn:aws:s3:::pre-prod-cdn.howdju.com/*"
      Sid       = "PublicReadGetObject"
    }]
    Version = "2012-10-17"
  })
}

resource "aws_s3_bucket_policy" "pre_prod_www_howdju_com" {
  bucket = aws_s3_bucket.pre_prod_www_howdju_com.id
  policy = jsonencode({
    Statement = [{
      Action    = "s3:GetObject"
      Effect    = "Allow"
      Principal = "*"
      Resource  = "arn:aws:s3:::pre-prod-www.howdju.com/*"
      Sid       = "PublicReadGetObject"
      }, {
      Action = "s3:PutObject"
      Effect = "Allow"
      Principal = {
        Service = "logging.s3.amazonaws.com"
      }
      Resource = "arn:aws:s3:::pre-prod-www.howdju.com/*"
      Sid      = "S3PolicyStmt-DO-NOT-MODIFY-1664240442387"
    }]
    Version = "2012-10-17"
  })
}

resource "aws_s3_bucket_policy" "www_howdju_com" {
  bucket = aws_s3_bucket.www_howdju_com.id
  policy = jsonencode({
    Statement = [{
      Action    = "s3:GetObject"
      Effect    = "Allow"
      Principal = "*"
      Resource  = "arn:aws:s3:::www.howdju.com/*"
      Sid       = "PublicReadGetObject"
    }]
    Version = "2012-10-17"
  })
}

resource "aws_cloudfront_distribution" "cdn_howdju_com" {
  aliases             = ["cdn.howdju.com"]
  enabled             = true
  http_version        = "http2"
  is_ipv6_enabled     = true
  price_class         = "PriceClass_100"
  retain_on_delete    = false
  staging             = false
  wait_for_deployment = true
  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    default_ttl            = 86400
    max_ttl                = 31536000
    min_ttl                = 0
    smooth_streaming       = false
    target_origin_id       = "S3-cdn.howdju.com"
    viewer_protocol_policy = "allow-all"
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
    grpc_config {
      enabled = false
    }
  }
  origin {
    connection_attempts = 3
    connection_timeout  = 10
    domain_name         = "cdn.howdju.com.s3.amazonaws.com"
    origin_id           = "S3-cdn.howdju.com"
  }
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  viewer_certificate {
    acm_certificate_arn            = aws_acm_certificate.howdju.arn
    cloudfront_default_certificate = false
    minimum_protocol_version       = "TLSv1.1_2016"
    ssl_support_method             = "sni-only"
  }
  lifecycle {
    ignore_changes = [tags_all]
  }
}

resource "aws_cloudfront_distribution" "docs_howdju_com" {
  aliases             = ["docs.howdju.com"]
  comment             = "docs.howdju.com S3 website hosting"
  enabled             = true
  http_version        = "http2and3"
  is_ipv6_enabled     = true
  price_class         = "PriceClass_All"
  retain_on_delete    = false
  staging             = false
  wait_for_deployment = true
  custom_error_response {
    error_caching_min_ttl = 10
    error_code            = 404
    response_code         = 200
    response_page_path    = "/not-found.html"
  }
  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cache_policy_id        = "658327ea-f89d-4fab-a63d-7e88639e58f6"
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    default_ttl            = 0
    max_ttl                = 0
    min_ttl                = 0
    smooth_streaming       = false
    target_origin_id       = "docs.howdju.com.s3-website-us-east-1.amazonaws.com"
    viewer_protocol_policy = "redirect-to-https"
    grpc_config {
      enabled = false
    }
  }
  origin {
    connection_attempts = 3
    connection_timeout  = 10
    domain_name         = "docs.howdju.com.s3-website-us-east-1.amazonaws.com"
    origin_id           = "docs.howdju.com.s3-website-us-east-1.amazonaws.com"
    custom_origin_config {
      http_port                = 80
      https_port               = 443
      origin_keepalive_timeout = 5
      origin_protocol_policy   = "http-only"
      origin_read_timeout      = 30
      origin_ssl_protocols     = ["TLSv1.2"]
    }
  }
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  viewer_certificate {
    acm_certificate_arn            = aws_acm_certificate.docs_howdju.arn
    cloudfront_default_certificate = false
    minimum_protocol_version       = "TLSv1.2_2021"
    ssl_support_method             = "sni-only"
  }
  lifecycle {
    ignore_changes = [tags_all]
  }
}

resource "aws_cloudfront_distribution" "howdju_com" {
  aliases             = ["howdju.com"]
  enabled             = true
  http_version        = "http2"
  is_ipv6_enabled     = true
  price_class         = "PriceClass_100"
  retain_on_delete    = false
  staging             = false
  wait_for_deployment = true
  default_cache_behavior {
    allowed_methods          = ["GET", "HEAD"]
    cache_policy_id          = "d8b49be2-267f-416f-be57-19a754fc32e0"
    cached_methods           = ["GET", "HEAD"]
    compress                 = true
    default_ttl              = 0
    max_ttl                  = 0
    min_ttl                  = 0
    origin_request_policy_id = "95424398-e9e3-4ef9-9a6c-1961834ef9a4"
    smooth_streaming         = false
    target_origin_id         = "S3-Website-howdju.com"
    viewer_protocol_policy   = "redirect-to-https"
    grpc_config {
      enabled = false
    }
  }
  origin {
    connection_attempts = 3
    connection_timeout  = 10
    domain_name         = "howdju.com.s3-website-us-east-1.amazonaws.com"
    origin_id           = "S3-Website-howdju.com"
    custom_origin_config {
      http_port                = 80
      https_port               = 443
      origin_keepalive_timeout = 5
      origin_protocol_policy   = "http-only"
      origin_read_timeout      = 30
      origin_ssl_protocols     = ["TLSv1.2"]
    }
  }
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  viewer_certificate {
    acm_certificate_arn            = aws_acm_certificate.howdju.arn
    cloudfront_default_certificate = false
    minimum_protocol_version       = "TLSv1.2_2021"
    ssl_support_method             = "sni-only"
  }
  lifecycle {
    ignore_changes = [tags_all]
  }
}

resource "aws_cloudfront_distribution" "pre_prod_cdn_howdju_com" {
  aliases             = ["pre-prod-cdn.howdju.com"]
  enabled             = true
  http_version        = "http2"
  is_ipv6_enabled     = true
  price_class         = "PriceClass_100"
  retain_on_delete    = false
  staging             = false
  wait_for_deployment = true
  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    default_ttl            = 86400
    max_ttl                = 31536000
    min_ttl                = 0
    smooth_streaming       = false
    target_origin_id       = "S3-pre-prod-cdn.howdju.com"
    viewer_protocol_policy = "allow-all"
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
    grpc_config {
      enabled = false
    }
  }
  origin {
    connection_attempts = 3
    connection_timeout  = 10
    domain_name         = "pre-prod-cdn.howdju.com.s3.amazonaws.com"
    origin_id           = "S3-pre-prod-cdn.howdju.com"
  }
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  viewer_certificate {
    acm_certificate_arn            = aws_acm_certificate.howdju.arn
    cloudfront_default_certificate = false
    minimum_protocol_version       = "TLSv1.1_2016"
    ssl_support_method             = "sni-only"
  }
  lifecycle {
    ignore_changes = [tags_all]
  }
}

resource "aws_cloudfront_distribution" "pre_prod_www_howdju_com" {
  aliases             = ["pre-prod-www.howdju.com"]
  enabled             = true
  http_version        = "http2"
  is_ipv6_enabled     = true
  price_class         = "PriceClass_100"
  retain_on_delete    = false
  staging             = false
  wait_for_deployment = true
  custom_error_response {
    error_caching_min_ttl = 300
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
  }
  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    default_ttl            = 86400
    max_ttl                = 31536000
    min_ttl                = 0
    smooth_streaming       = false
    target_origin_id       = "S3-Website-pre-prod-www.howdju.com.s3-website-us-east-1.amazonaws.com"
    viewer_protocol_policy = "allow-all"
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
    grpc_config {
      enabled = false
    }
  }
  origin {
    connection_attempts = 3
    connection_timeout  = 10
    domain_name         = "pre-prod-www.howdju.com.s3-website-us-east-1.amazonaws.com"
    origin_id           = "S3-Website-pre-prod-www.howdju.com.s3-website-us-east-1.amazonaws.com"
    custom_origin_config {
      http_port                = 80
      https_port               = 443
      origin_keepalive_timeout = 5
      origin_protocol_policy   = "http-only"
      origin_read_timeout      = 30
      origin_ssl_protocols     = ["TLSv1", "TLSv1.1", "TLSv1.2"]
    }
  }
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  viewer_certificate {
    acm_certificate_arn            = aws_acm_certificate.howdju.arn
    cloudfront_default_certificate = false
    minimum_protocol_version       = "TLSv1"
    ssl_support_method             = "sni-only"
  }
  lifecycle {
    ignore_changes = [tags_all]
  }
}

resource "aws_cloudfront_distribution" "www_howdju_com" {
  aliases             = ["www.howdju.com"]
  default_root_object = "index.html"
  enabled             = true
  http_version        = "http2"
  is_ipv6_enabled     = true
  price_class         = "PriceClass_100"
  retain_on_delete    = false
  staging             = false
  wait_for_deployment = true
  custom_error_response {
    error_caching_min_ttl = 0
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
  }
  default_cache_behavior {
    allowed_methods          = ["GET", "HEAD"]
    cache_policy_id          = "d8b49be2-267f-416f-be57-19a754fc32e0"
    cached_methods           = ["GET", "HEAD"]
    compress                 = true
    default_ttl              = 0
    max_ttl                  = 0
    min_ttl                  = 0
    origin_request_policy_id = "95424398-e9e3-4ef9-9a6c-1961834ef9a4"
    smooth_streaming         = false
    target_origin_id         = "S3-www.howdju.com"
    viewer_protocol_policy   = "redirect-to-https"
    grpc_config {
      enabled = false
    }
  }
  origin {
    connection_attempts = 3
    connection_timeout  = 10
    domain_name         = "www.howdju.com.s3-website-us-east-1.amazonaws.com"
    origin_id           = "S3-www.howdju.com"
    custom_origin_config {
      http_port                = 80
      https_port               = 443
      origin_keepalive_timeout = 5
      origin_protocol_policy   = "http-only"
      origin_read_timeout      = 30
      origin_ssl_protocols     = ["TLSv1.2"]
    }
  }
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  viewer_certificate {
    acm_certificate_arn            = aws_acm_certificate.howdju.arn
    cloudfront_default_certificate = false
    minimum_protocol_version       = "TLSv1"
    ssl_support_method             = "sni-only"
  }
  lifecycle {
    ignore_changes = [tags_all]
  }
}
