import { Moment } from "moment";

import {
  CreateTag,
  EntityId,
  isBareRef,
  PersistedEntity,
  TagOut,
} from "howdju-common";

import { TagsDao } from "../daos";
import { EntityNotFoundError } from "..";

export class TagsService {
  constructor(private tagsDao: TagsDao) {}

  readTagForId(tagId: EntityId) {
    return this.tagsDao.readTagForId(tagId);
  }

  readAllTags() {
    return this.tagsDao.readAllTags();
  }

  async readOrCreateValidTagAsUser(
    userId: EntityId,
    tag: PersistedEntity | CreateTag,
    now: Moment
  ): Promise<TagOut> {
    if (isBareRef(tag)) {
      const extantTag = await this.tagsDao.readTagForId(tag.id);
      if (!extantTag) {
        throw new EntityNotFoundError("TAG", tag.id);
      }
      return extantTag;
    }
    const equivalentTag = await this.tagsDao.readTagForName(tag.name);
    if (equivalentTag) {
      return equivalentTag;
    }
    return this.tagsDao.createTag(userId, tag, now);
  }

  readTagsLikeTagName(tagName: string): Promise<TagOut[]> {
    return this.tagsDao.readTagsLikeName(tagName);
  }
}
