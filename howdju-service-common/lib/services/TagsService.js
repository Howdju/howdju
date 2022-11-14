const Promise = require("bluebird");

const { requireArgs } = require("howdju-common");

exports.TagsService = class TagsService {
  constructor(logger, tagsDao) {
    requireArgs({ logger, tagsDao });
    this.logger = logger;
    this.tagsDao = tagsDao;
  }

  readTagForId(tagId) {
    return this.tagsDao.readTagForId(tagId);
  }

  readOrCreateValidTagAsUser(userId, tag, now) {
    return Promise.resolve()
      .then(() => {
        if (tag.id) {
          return this.tagsDao.readTagForId(tag.id);
        }
        return null;
      })
      .then((extantTag) => {
        if (extantTag) {
          return extantTag;
        }
        return this.tagsDao.readTagForName(tag.name);
      })
      .then((equivalentTag) => {
        if (equivalentTag) {
          return equivalentTag;
        }
        return this.tagsDao.createTag(userId, tag, now);
      });
  }

  readTagsLikeTagName(tagName) {
    return this.tagsDao.readTagsLikeName(tagName);
  }
};
