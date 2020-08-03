'use strict';

const aws = require('aws-sdk');

exports.handler = async (event, context, callback) => {
  const region = process.env.aws_region;
  const endpoint = process.env.ses_endpoint;
  const do_use_sesv2 = process.env.sesv2;
  console.log({region, endpoint, do_use_sesv2});
  const sslEnabled = true;
  const ses = new aws.SES({region, endpoint, sslEnabled});
  const sesv2 = new aws.SESV2({region, endpoint, sslEnabled});

  const v1Params = {
    Source: "notifications@howdju.com",
    Destination: {ToAddresses: ["carl.gieinger@gmail.com"]},
    Message: {
      Subject: {Data: "Test Email"},
      Body: {Text: {Data: "Test"}},
    },
    Tags: [{"Name": "MyTag", "Value": "MyTagValue"}],
  };
  const v2Params = {
    FromEmailAddress: "notifications@howdju.com",
    Destination: {ToAddresses: ["carl.gieinger@gmail.com"]},
    Content: {
      Simple: {
        Subject: {Data: "Test Email"},
        Body: {Text: {Data: "Test"}},
      },
    },
    EmailTags: [{"Name": "MyTag", "Value": "MyTagValue"}],
  };

  try {
    const response = await (do_use_sesv2 ?
      sesv2.sendEmail(v2Params).promise() :
      ses.sendEmail(v1Params).promise());
    return context.succeed({response});
  } catch (err) {
    return context.fail(JSON.stringify(err));
  }
};
