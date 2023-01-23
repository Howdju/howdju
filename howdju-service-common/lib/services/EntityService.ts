import { z } from "zod";
import { Schema, isSchema } from "joi";

import {
  requireArgs,
  formatZodError,
  AuthToken,
  newProgrammingError,
  Entity,
  Logger,
  utcNow,
} from "howdju-common";

import { AuthenticationError, EntityValidationError } from "../serviceErrors";
import { translateJoiError } from "./validationSchemas";
import { translateJoiToZodFormattedError } from "./joiErrors";
import { AuthService } from "./AuthService";
import { isJoiSchema } from "./joiValidation";
import { Moment } from "moment";

interface EntitySchemas {
  createSchema: z.ZodTypeAny;
  updateSchema?: z.ZodTypeAny;
}

type EntityPropped<T, P extends string> = {
  [key in P]: T;
};

export abstract class EntityService<
  CreateIn extends Entity,
  CreateOut extends Entity,
  UpdateIn extends Entity,
  UpdateOut extends Entity,
  P extends string
> {
  entitySchemas: EntitySchemas | Schema;
  logger: any;
  authService: AuthService;

  constructor(
    entitySchemas: EntitySchemas | Schema,
    logger: Logger,
    authService: AuthService
  ) {
    requireArgs({ entitySchemas, logger, authService });
    this.entitySchemas = entitySchemas;
    this.logger = logger;
    this.authService = authService;
  }

  async readOrCreate(
    entity: CreateIn,
    authToken: AuthToken
  ): Promise<{ isExtant: boolean } & EntityPropped<CreateOut, P>> {
    const now = utcNow();
    const entitySchema = isJoiSchema(this.entitySchemas)
      ? this.entitySchemas
      : this.entitySchemas.createSchema;
    const { value, error } = this.validateEntity(entitySchema, entity);
    if (error) {
      throw new EntityValidationError(error);
    }
    // If the entity lacks an ID, then it is an attempt to create.
    if (!entity.id && !authToken) {
      throw new AuthenticationError("Must be logged in to create.");
    }
    const userId = authToken
      ? await this.authService.readUserIdForAuthToken(authToken)
      : undefined;
    return await this.doReadOrCreate(value, userId, now);
  }

  protected abstract doReadOrCreate(
    entity: CreateIn,
    userId: string | undefined,
    now: Moment
  ): Promise<{ isExtant: boolean } & EntityPropped<CreateOut, P>>;

  async update(entity: UpdateIn, authToken: AuthToken): Promise<UpdateOut> {
    if (!entity.id) {
      throw new EntityValidationError({
        id: ["id is required to update an entity"],
      });
    }

    const now = utcNow();
    const userId = await this.authService.readUserIdForAuthToken(authToken);
    const entitySchema = isJoiSchema(this.entitySchemas)
      ? this.entitySchemas
      : this.entitySchemas.updateSchema;
    if (!entitySchema) {
      throw newProgrammingError("Entity does not support updates.");
    }
    const { error, value } = this.validateEntity(entitySchema, entity);
    if (error) {
      const errors = translateJoiError(error);
      throw new EntityValidationError(errors);
    }
    return await this.doUpdate(value, userId, now);
  }

  protected abstract doUpdate(
    entity: UpdateIn,
    userId: string,
    now: Moment
  ): Promise<UpdateOut>;

  protected validateEntity(
    entitySchema: z.ZodTypeAny | Schema,
    entity: CreateIn | UpdateIn
  ) {
    if (entitySchema instanceof z.ZodType) {
      const result = entitySchema.safeParse(entity);
      if (result.success) {
        return { value: result.data };
      }
      return { value: entity, error: formatZodError(result.error) };
    }
    if (!isSchema(entitySchema)) {
      throw newProgrammingError("entitySchemas must be Zod or Joi.");
    }
    const { error, value } = entitySchema.validate(entity, {
      // report all errors
      abortEarly: false,
      // for now allow clients to send extra properties, such as viewmodel properties, for convenience.
      // in the future we might consolidate the validation for use between the client and API and have the client
      //   strip the unknown properties itself
      stripUnknown: true,
    });
    if (error) {
      return { value, error: translateJoiToZodFormattedError(error) };
    }
    return { value };
  }
}
