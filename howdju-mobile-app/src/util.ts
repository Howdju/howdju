import logger from "@/logger";

/** Await the promise and log the error reason with message. */
export async function logPromiseError(promise: Promise<any>, message: string) {
  try {
    return await promise;
  } catch (reason) {
    logger.error(`${message}: ${reason}`);
  }
}
