import { logger, PersistedEntity, toJson } from "howdju-common";
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
export async function readWriteReread<E extends PersistedEntity>(
  readEquivalent: () => Promise<E | undefined>,
  write: () => Promise<E>
): Promise<{ entity: E; isExtant: boolean }> {
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
        `Thrown was not a DatabaseError (${err.constructor.name}): ${toJson(
          err
        )}`
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

/**
 * Implements a read-write-reread pattern when the entity lacks a DB-based unique constraint.
 *
 * One of Howdju's primary goals is to consolidate entities that are equivalent.
 * This helper function encapsupates a pattern that is used throughout the
 * service to create a new entity, but only if an equivalent one does not exist.
 * It achieves this by:
 *
 * - read equivalent entities from the database
 * - if there are none, write the current one
 * - re-read for equivalent entities.
 *
 * If equivalent entities are found, the one having the lowest ID is returned.
 *
 * TODO delete extraneous entites on a schedule.
 *
 * @param entitiesName A name for the entities to use in logging.
 * @param readEquivalent A function that reads equivalent entities from the database.
 * @param write A function that writes the entity to the database.
 */
export async function readWriteRereadUnconstrained<E extends PersistedEntity>(
  entitiesName: string,
  readEquivalent: () => Promise<E[]>,
  write: () => Promise<E>
): Promise<{ entity: E; isExtant: boolean }> {
  const extantEntities = await readEquivalent();
  if (extantEntities.length) {
    if (extantEntities.length > 1) {
      logger.warn(
        `Found multiple equivalent ${entitiesName}: ${toJson(
          extantEntities.map((e) => e.id)
        )}`
      );
    }
    const extantEntity = selectLowestId(extantEntities);
    return {
      entity: extantEntity,
      isExtant: true,
    };
  }

  const entity = await write();

  const interveningEntities = await readEquivalent();

  if (!interveningEntities.length) {
    return {
      entity,
      isExtant: false,
    };
  }

  logger.info(
    `Found equivalent ${entitiesName} after write: ${toJson({
      writtenId: entity.id,
      equivalentIds: interveningEntities.map((e) => e.id),
    })}`
  );
  const lowestEntity = selectLowestId(interveningEntities);
  const isExtant = lowestEntity.id !== entity.id;

  return {
    entity: lowestEntity,
    isExtant,
  };
}

function selectLowestId<E extends PersistedEntity>(entities: E[]) {
  return entities.reduce((lowest, entity) =>
    lowest.id < entity.id ? lowest : entity
  );
}
