import { CreateTag, EntityId, Logger, requireArgs } from "howdju-common";

import { TagsDao } from "../daos";

export class TagsService {
  logger: Logger;
  tagsDao: TagsDao;

  constructor(logger: Logger, tagsDao: TagsDao) {
    requireArgs({ logger, tagsDao });
    this.logger = logger;
    this.tagsDao = tagsDao;
  }

  async readTagForId(tagId: EntityId) {
    return await this.tagsDao.readTagForId(tagId);
  }

  async readOrCreateValidTagAsUser(
    userId: EntityId,
    tag: CreateTag,
    now: Date
  ) {
    const extantTag = await this.tagsDao.readTagForId(tag.id);
    if (extantTag) {
      return extantTag;
    }
    const equivalentTag = await this.tagsDao.readTagForName(tag.name);
    if (equivalentTag) {
      return equivalentTag;
    }
    return await this.tagsDao.createTag(userId, tag, now);
  }

  async readTagsLikeTagName(tagName: string) {
    return await this.tagsDao.readTagsLikeName(tagName);
  }
}
