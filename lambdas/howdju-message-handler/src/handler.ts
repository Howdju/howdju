import { Context, SNSEvent, Callback } from "aws-lambda";

import { provider } from "./provider";
import { MessageHandler } from "./MessageHandler";

const handlerImpl = new MessageHandler(provider);

export function handler(event: SNSEvent, context: Context, callback: Callback) {
  return handlerImpl.handle(event, context, callback);
}
