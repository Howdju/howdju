import { z } from "zod";
import { Schema, isSchema } from "joi";

import {
  requireArgs,
  formatZodError,
  AuthToken,
  newProgrammingError,
  Entity,
} from "howdju-common";

import { EntityValidationError } from "../serviceErrors";
import { translateJoiError } from "./validationSchemas";
import { translateJoiToZodFormattedError } from "./joiErrors";
import { AuthService } from "./AuthService";
import { AwsLogger } from "..";
import { isJoiSchema } from "./joiValidation";
import Promise from "any-promise";

interface EntitySchemas {
  createSchema: z.ZodTypeAny;
  editSchema: z.ZodTypeAny;
}

export abstract class EntityService<T extends Entity> {
  entitySchemas: EntitySchemas | Schema;
  logger: any;
  authService: AuthService;

  constructor(
    entitySchemas: EntitySchemas | Schema,
    logger: AwsLogger,
    authService: AuthService
  ) {
    requireArgs({ entitySchemas, logger, authService });
    this.entitySchemas = entitySchemas;
    this.logger = logger;
    this.authService = authService;
  }

  validateEntity(entitySchema: z.ZodTypeAny | Schema, entity: T) {
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

  async readOrCreate(entity: T, authToken: AuthToken) {
    const now = new Date();
    const userId = await this.authService.readUserIdForAuthToken(authToken);
    const entitySchema = isJoiSchema(this.entitySchemas)
      ? this.entitySchemas
      : this.entitySchemas.createSchema;
    const { value, error } = this.validateEntity(entitySchema, entity);
    if (error) {
      throw new EntityValidationError(error);
    }
    return await this.doReadOrCreate(value, userId, now);
  }

  abstract doReadOrCreate(entity: T, userId: string, now: Date): Promise<T>;

  async update(entity: T, authToken: AuthToken) {
    if (!entity.id) {
      throw new EntityValidationError({
        id: ["id is required to update an entity"],
      });
    }

    const now = new Date();
    const userId = await this.authService.readUserIdForAuthToken(authToken);
    const entitySchema = isJoiSchema(this.entitySchemas)
      ? this.entitySchemas
      : this.entitySchemas.editSchema;
    const { error, value } = this.validateEntity(entitySchema, entity);
    if (error) {
      const errors = translateJoiError(error);
      throw new EntityValidationError(errors);
    }
    return await this.doUpdate(value, userId, now);
  }

  abstract doUpdate(entity: T, userId: string, now: Date): Promise<T>;
}
