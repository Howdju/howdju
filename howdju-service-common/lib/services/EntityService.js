import { z } from "zod";

import { requireArgs, zodIssueFormatter } from "howdju-common";

import { EntityValidationError } from "../serviceErrors";
import { translateJoiError } from "./validationSchemas";
import { translateJoiToZodFormattedError } from "./joiErrors";

function validateEntity(entitySchema, entity) {
  if (entitySchema instanceof z.ZodType) {
    const result = entitySchema.safeParse(entity);
    if (result.success) {
      return { value: result.data };
    }
    return { value: entity, error: result.error.format(zodIssueFormatter) };
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

export class EntityService {
  constructor(entitySchema, logger, authService) {
    requireArgs({ entitySchema, logger, authService });
    this.entitySchema = entitySchema;
    this.logger = logger;
    this.authService = authService;
  }

  async readOrCreate(entity, authToken) {
    const now = new Date();
    const userId = await this.authService.readUserIdForAuthToken(authToken);
    const { value, error } = validateEntity(this.entitySchema, entity);
    if (error) {
      throw new EntityValidationError(error);
    }
    return await this.doReadOrCreate(value, userId, now);
  }

  async update(entity, authToken) {
    if (!entity.id) {
      throw new EntityValidationError({
        id: ["id is required to update an entity"],
      });
    }

    const now = new Date();
    const userId = await this.authService.readUserIdForAuthToken(authToken);
    const { error, value } = this.entitySchema.validate(entity, {
      // report all errors
      abortEarly: false,
      // for now allow clients to send extra properties, such as viewmodel properties, for convenience.
      // in the future we might consolidate the validation for use between the client and API and have the client
      //   strip the unknown properties itself
      stripUnknown: true,
    });
    if (error) {
      const errors = translateJoiError(error);
      throw new EntityValidationError(errors);
    }
    return await this.doUpdate(value, userId, now);
  }
}
