import { z } from "zod";
import { Schema, isSchema } from "joi";

import {
  formatZodError,
  AuthToken,
  newProgrammingError,
  Entity,
  utcNow,
  EntityRef,
  newImpossibleError,
  isRef,
  ModelErrors,
  makeModelErrors,
  PersistedEntity,
} from "howdju-common";

import {
  AuthenticationError,
  AuthorizationError,
  EntityValidationError,
} from "../serviceErrors";
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
  CreateIn extends object,
  CreateOut extends Entity,
  UpdateIn extends PersistedEntity,
  UpdateOut extends PersistedEntity,
  P extends string
> {
  constructor(
    private entitySchemas: EntitySchemas | Schema,
    protected authService: AuthService
  ) {}

  async readOrCreate(
    entity: CreateIn | EntityRef<CreateIn>,
    authToken: AuthToken | undefined
  ): Promise<{ isExtant: boolean } & EntityPropped<CreateOut, P>> {
    const now = utcNow();
    const userId = authToken
      ? await this.authService.readUserIdForAuthToken(authToken)
      : undefined;
    if ("id" in entity) {
      return await this.doReadOrCreate(entity, userId, now);
    }
    if (isRef(entity)) {
      throw newImpossibleError(
        "The entity can't be a ref if its id was falsy."
      );
    }

    const entitySchema = isJoiSchema(this.entitySchemas)
      ? this.entitySchemas
      : this.entitySchemas.createSchema;
    const { value, error } = this.validateEntity(entitySchema, entity);
    if (error) {
      throw new EntityValidationError(error);
    }
    // If the entity lacks an ID, then it is an attempt to create.
    if (!("id" in entity) && !authToken) {
      throw new AuthenticationError("Must be logged in to create.");
    }

    return await this.doReadOrCreate(value, userId, now);
  }

  protected abstract doReadOrCreate(
    entity: CreateIn | EntityRef<CreateIn>,
    userId: string | undefined,
    now: Moment
  ): Promise<{ isExtant: boolean } & EntityPropped<CreateOut, P>>;

  async update(
    entity: UpdateIn,
    authToken: AuthToken | undefined
  ): Promise<UpdateOut> {
    if (!authToken) {
      throw new AuthorizationError(
        makeModelErrors<UpdateOut>((e) =>
          e("Unauthenticated users may not update entities.")
        )
      );
    }
    if (!entity.id) {
      throw new EntityValidationError(
        // I'm not sure why the generic param can't be UpdateIn.
        makeModelErrors<PersistedEntity>((u) =>
          u.id("id is required to update an entity")
        )
      );
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
      throw new EntityValidationError(error);
    }
    return await this.doUpdate(value, userId, now);
  }

  protected abstract doUpdate(
    entity: UpdateIn,
    userId: string,
    now: Moment
  ): Promise<UpdateOut>;

  protected validateEntity<
    Input extends CreateIn | UpdateIn,
    Def extends z.ZodTypeDef,
    Output = Input
  >(
    entitySchema: z.ZodType<Output, Def, Input> | Schema,
    entity: Input
  ):
    | { value: Output; error: undefined }
    | { value: Input; error: ModelErrors<Input> } {
    if (entitySchema instanceof z.ZodType) {
      const result = entitySchema.safeParse(entity);
      if (result.success) {
        return { value: result.data, error: undefined };
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
      return { value, error: translateJoiToZodFormattedError<Input>(error) };
    }
    return { value, error: undefined };
  }
}
