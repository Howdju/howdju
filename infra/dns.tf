resource "aws_route53_record" "amazonses_txt" {
  name    = "_amazonses.howdju.com"
  records = ["bToPHw1JM0Eo9vOcACIC8MGD82tM18dy3MzlCm64fzU="]
  ttl     = 1800
  type    = "TXT"
  zone_id = data.aws_route53_zone.howdju.zone_id
}

resource "aws_route53_record" "apex_a" {
  name    = "howdju.com"
  type    = "A"
  zone_id = data.aws_route53_zone.howdju.zone_id
  alias {
    evaluate_target_health = false
    name                   = aws_cloudfront_distribution.howdju_com.domain_name
    zone_id                = aws_cloudfront_distribution.howdju_com.hosted_zone_id
  }
}

resource "aws_route53_record" "apex_mx" {
  name    = "howdju.com"
  records = ["10 ASPMX.L.GOOGLE.COM.", "20 ALT2.ASPMX.L.GOOGLE.COM.", "30 ASPMX2.GOOGLEMAIL.COM.", "30 ASPMX3.GOOGLEMAIL.COM.", "30 ASPMX4.GOOGLEMAIL.COM.", "30 ASPMX5.GOOGLEMAIL.COM."]
  ttl     = 300
  type    = "MX"
  zone_id = data.aws_route53_zone.howdju.zone_id
}

resource "aws_route53_record" "apex_txt" {
  name    = "howdju.com"
  records = ["google-site-verification=YIcao9qscnohvaMU3uDMy7w97lHxe6s1RjfsEu5IdTM", "google-site-verification=sG-W9rKs7Wwj9h7o8En8h2qRyuvSphjpn1bDzq4NLtU", "google-site-verification=wtFlaOfm_hF4b7NPhcU9YlrQynh67zy4wt4O7CzlUAM"]
  ttl     = 300
  type    = "TXT"
  zone_id = data.aws_route53_zone.howdju.zone_id
}

resource "aws_route53_record" "api_cname" {
  name    = "api.howdju.com"
  records = ["${aws_api_gateway_domain_name.api_howdju_com.cloudfront_domain_name}."]
  ttl     = 300
  type    = "CNAME"
  zone_id = data.aws_route53_zone.howdju.zone_id
}

resource "aws_route53_record" "cal_cname" {
  name    = "cal.howdju.com"
  records = ["ghs.google.com."]
  ttl     = 300
  type    = "CNAME"
  zone_id = data.aws_route53_zone.howdju.zone_id
}

resource "aws_route53_record" "cdcv4pktv2fzkf7l5iza5zivr6u24bvg_domainkey_cname" {
  name    = "cdcv4pktv2fzkf7l5iza5zivr6u24bvg._domainkey.howdju.com"
  records = ["cdcv4pktv2fzkf7l5iza5zivr6u24bvg.dkim.amazonses.com"]
  ttl     = 1800
  type    = "CNAME"
  zone_id = data.aws_route53_zone.howdju.zone_id
}

resource "aws_route53_record" "cdn_cname" {
  name    = "cdn.howdju.com"
  records = [aws_cloudfront_distribution.cdn_howdju_com.domain_name]
  ttl     = 300
  type    = "CNAME"
  zone_id = data.aws_route53_zone.howdju.zone_id
}

resource "aws_route53_record" "dcb31f88562438c981e44f929d8c5cd3_cname" {
  name    = "_dcb31f88562438c981e44f929d8c5cd3.howdju.com"
  records = ["_93bb21a3521691e577307b44a966909e.jfrzftwwjs.acm-validations.aws."]
  ttl     = 300
  type    = "CNAME"
  zone_id = data.aws_route53_zone.howdju.zone_id
}

resource "aws_route53_record" "dev_api_cname" {
  name    = "dev-api.howdju.com"
  records = [aws_api_gateway_domain_name.dev_api_howdju_com.cloudfront_domain_name]
  ttl     = 300
  type    = "CNAME"
  zone_id = data.aws_route53_zone.howdju.zone_id
}

resource "aws_route53_record" "docs_acm_validation_cname" {
  name    = "_76280c04f038e2523c6ba214ec801839.docs.howdju.com"
  records = ["_10eb00d4b9c2837c1f5099598457e34c.plkdfvcnsy.acm-validations.aws."]
  ttl     = 300
  type    = "CNAME"
  zone_id = data.aws_route53_zone.howdju.zone_id
}

resource "aws_route53_record" "docs_cname" {
  name    = "docs.howdju.com"
  records = ["${aws_cloudfront_distribution.docs_howdju_com.domain_name}."]
  ttl     = 300
  type    = "CNAME"
  zone_id = data.aws_route53_zone.howdju.zone_id
}

resource "aws_route53_record" "github_challenge_howdju_org_txt" {
  name    = "_github-challenge-howdju-org.howdju.com"
  records = ["321c26d25b"]
  ttl     = 300
  type    = "TXT"
  zone_id = data.aws_route53_zone.howdju.zone_id
}

resource "aws_route53_record" "google_domainkey_txt" {
  name    = "google._domainkey.howdju.com"
  records = ["v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDJxgxo3QM0APL11NxUbCXimF k2dONDLH2++LHUNbi0opXgGoq69O6pRjJIETiWm9Tjdm6uL+S/HfxDoJVtpmB/2bZ7pVODXnS8ZX2el3 caLUQEDDBkd/RYo7o0n/Mzmpem2gZtn439SG95hXSxQyUFx6V8p4KMGa4DQ1VIXnh7TQIDAQAB"]
  ttl     = 300
  type    = "TXT"
  zone_id = data.aws_route53_zone.howdju.zone_id
}

resource "aws_route53_record" "mail_cname" {
  name    = "mail.howdju.com"
  records = ["ghs.googlehosted.com."]
  ttl     = 300
  type    = "CNAME"
  zone_id = data.aws_route53_zone.howdju.zone_id
}

resource "aws_route53_record" "notifications_mx" {
  name    = "notifications.howdju.com"
  records = ["10 feedback-smtp.us-east-1.amazonses.com"]
  ttl     = 300
  type    = "MX"
  zone_id = data.aws_route53_zone.howdju.zone_id
}

resource "aws_route53_record" "notifications_txt" {
  name    = "notifications.howdju.com"
  records = ["v=spf1 include:amazonses.com ~all"]
  ttl     = 300
  type    = "TXT"
  zone_id = data.aws_route53_zone.howdju.zone_id
}

resource "aws_route53_record" "pre_prod_api_cname" {
  name    = "pre-prod-api.howdju.com"
  records = ["${aws_api_gateway_domain_name.pre_prod_api_howdju_com.cloudfront_domain_name}."]
  ttl     = 300
  type    = "CNAME"
  zone_id = data.aws_route53_zone.howdju.zone_id
}

resource "aws_route53_record" "pre_prod_cdn_cname" {
  name    = "pre-prod-cdn.howdju.com"
  records = [aws_cloudfront_distribution.pre_prod_cdn_howdju_com.domain_name]
  ttl     = 300
  type    = "CNAME"
  zone_id = data.aws_route53_zone.howdju.zone_id
}

resource "aws_route53_record" "pre_prod_www_cname" {
  name    = "pre-prod-www.howdju.com"
  records = ["${aws_cloudfront_distribution.pre_prod_www_howdju_com.domain_name}."]
  ttl     = 300
  type    = "CNAME"
  zone_id = data.aws_route53_zone.howdju.zone_id
}

resource "aws_route53_record" "q5adni73p7azafnidxmazkjjtigo25dq_domainkey_cname" {
  name    = "q5adni73p7azafnidxmazkjjtigo25dq._domainkey.howdju.com"
  records = ["q5adni73p7azafnidxmazkjjtigo25dq.dkim.amazonses.com"]
  ttl     = 1800
  type    = "CNAME"
  zone_id = data.aws_route53_zone.howdju.zone_id
}

resource "aws_route53_record" "ses_dkim_6aczssebmxrzudwkkcndjchw5gta4mm7_cname" {
  name    = "6aczssebmxrzudwkkcndjchw5gta4mm7._domainkey.howdju.com"
  records = ["6aczssebmxrzudwkkcndjchw5gta4mm7.dkim.amazonses.com"]
  ttl     = 1800
  type    = "CNAME"
  zone_id = data.aws_route53_zone.howdju.zone_id
}

resource "aws_route53_record" "www_cname" {
  name    = "www.howdju.com"
  records = ["${aws_cloudfront_distribution.www_howdju_com.domain_name}."]
  ttl     = 300
  type    = "CNAME"
  zone_id = data.aws_route53_zone.howdju.zone_id
}
