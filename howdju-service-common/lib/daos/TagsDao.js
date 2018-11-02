const {
  requireArgs,
  cleanWhitespace,
} = require('howdju-common')

const {
  mapSingle,
  mapMany,
  normalizeText,
} = require('./daosUtil')
const {
  toTag
} = require('./orm')

exports.TagsDao = class TagsDao {
  constructor(logger, database) {
    requireArgs({logger, database})
    this.logger = logger
    this.database = database
  }

  createTag(userId, tag, now) {
    return this.database.query(
      'createTag',
      `
      insert into tags (name, normal_name, created, creator_user_id) 
      values ($1, $2, $3, $4) 
      returning *
      `,
      [cleanWhitespace(tag.name), normalizeText(tag.name), now, userId]
    )
      .then(mapSingle(toTag))
  }

  readTagForId(tagId) {
    return this.database.query('readTagForId', `select * from tags where tag_id = $1 and deleted is null`, [tagId])
      .then(mapSingle(this.logger, toTag, 'tags', {tagId}))
  }

  readTagForName(tagName) {
    return this.database.query('readTagForName', `select * from tags where normal_name = $1 and deleted is null`, [normalizeText(tagName)])
      .then(mapSingle(this.logger, toTag, 'tags', {tagName}))
  }

  readTagsLikeName(tagName) {
    return this.database.query(
      'readTagsLikeName',
      `select * 
      from tags 
        where normal_name ilike '%' || $1 || '%' and deleted is null 
      order by length(name), name`,
      [normalizeText(tagName)]
    )
      .then(mapMany(toTag))
  }
}