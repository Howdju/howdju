import { logger, toJson } from "howdju-common";
import { DatabaseError } from "pg";

const CONSTRAINT_VIOLATION_CODE = "23505";

/**
 * Implements a read-write-reread pattern.
 *
 * One of Howdju's primary goals is to consolidate entities that are equivalent.
 * This helper function encapsupates a pattern that is used throughout the
 * service to create a new entity, but only if an equivalent one does not exist.
 * It achieves this by:
 *
 * - reading an equivalent entity from the database
 * - if it is absent, write it,
 * - and finally, if the write encountered a constraint violation, to
 *   read the entity again.
 *
 * @param readEquivalent A function that reads an equivalent entity from the database.
 * @param write A function that writes the entity to the database.
 */
export async function readWriteReread<T>(
  readEquivalent: () => Promise<T | undefined>,
  write: () => Promise<T>
): Promise<{ entity: T; isExtant: boolean }> {
  const extantEntity = await readEquivalent();
  if (extantEntity) {
    return {
      entity: extantEntity,
      isExtant: true,
    };
  }
  try {
    const entity = await write();
    return {
      entity,
      isExtant: false,
    };
  } catch (err) {
    if (!(err instanceof Error)) {
      throw new Error(`Thrown was not an Error: ${toJson(err)}`);
    }
    if (!(err instanceof DatabaseError)) {
      throw new Error(
        `Thrown was not a DatabaseError (${err.constructor.name}): ${err.message}`
      );
    }
    if (err.code !== CONSTRAINT_VIOLATION_CODE) {
      throw err;
    }

    const { detail, constraint } = err;
    logger.info(
      `An intervening row was created: ${toJson({ detail, constraint })}`
    );

    const interveningEntity = await readEquivalent();
    if (!interveningEntity) {
      throw new Error(
        "No intervening entity despite unique constraint violation."
      );
    }
    return {
      entity: interveningEntity,
      isExtant: true,
    };
  }
}
