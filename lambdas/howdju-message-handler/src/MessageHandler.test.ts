import type { SNS } from "aws-sdk";
import { Context, SNSEvent, Callback } from "aws-lambda";

import { AppProvider, AwsTopicMessageSender } from "howdju-service-common";
import { mockLogger } from "howdju-test-common";

import { MessageHandler } from "./MessageHandler";

const sendEmail = jest.fn();
const TOPIC_ARN = "the-test-topic-arn";
const provider = {
  logger: mockLogger,
  emailService: {
    sendEmail,
  },
} as unknown as AppProvider;

describe("handler", () => {
  it("handles a TopicMessageSender message", async () => {
    // Integration test of TopicMessageSender and handler
    const callback = jest.fn();
    const handler = new MessageHandler(provider);
    const mockSns = new MockSns(handler, callback);
    const topicMessageSender = new AwsTopicMessageSender(
      mockLogger,
      mockSns as unknown as SNS,
      TOPIC_ARN
    );
    const params = {
      from: "from@domain.com",
      to: "to@domain.com",
      subject: "the-subject",
      bodyHtml: "the-body-html",
      bodyText: "the-body-text",
    };

    await topicMessageSender.sendMessage({ type: "SEND_EMAIL", params });

    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledWith(params);
    expect(callback).toHaveBeenCalledTimes(1);
  });
});

class MockSns {
  constructor(
    private readonly handler: MessageHandler,
    private readonly callback: Callback
  ) {}

  publish(params: SNS.Types.PublishInput) {
    const { TopicArn, Message } = params;
    if (!TopicArn) {
      throw new Error("TopicArn is required");
    }
    const event: SNSEvent = {
      Records: [
        {
          Sns: {
            TopicArn,
            Message,
            SignatureVersion: "the-signature-version",
            Timestamp: "the-timestamp",
            Signature: "the-signature",
            SigningCertUrl: "the-signing-cert-url",
            MessageId: "the-message-id",
            MessageAttributes: {},
            Type: "the-type",
            UnsubscribeUrl: "the-unsubscribe-url",
            Subject: "the-subject",
          },
          EventVersion: "the-event-version",
          EventSubscriptionArn: "the-event-subscription-arn",
          EventSource: "the-event-source",
        },
      ],
    };
    const context: Context = {
      callbackWaitsForEmptyEventLoop: false,
      functionName: "the-function-name",
      functionVersion: "the-function-version",
      invokedFunctionArn: "the-invoked-function-arn",
      memoryLimitInMB: "the-memory-limit-in-mb",
      awsRequestId: "the-aws-request-id",
      logGroupName: "the-log-group-name",
      logStreamName: "the-log-stream-name",
      getRemainingTimeInMillis: () => 1,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      done: (_error?: Error | undefined, _result?: any) => {},
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      fail: (_error: string | Error) => {},
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      succeed: (_messageOrObject: any) => {},
    };

    const promise = async () => {
      // Call the actual handler
      await this.handler.handle(event, context, this.callback);
      return { MessageId: "the-message-id" };
    };
    return { promise };
  }
}
