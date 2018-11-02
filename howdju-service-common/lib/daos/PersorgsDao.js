const {
  cleanWhitespace,
  requireArgs,
} = require('howdju-common')

const {
  normalizeText,
} = require('./daosUtil')
const {
  toPersorg
} = require('./orm')
const {
  BaseDao
} = require('./BaseDao')



exports.PersorgsDao = class PersorgsDao extends BaseDao {
  constructor(logger, database) {
    requireArgs({logger, database})
    super(logger, database)
    this.mapper = toPersorg
  }

  async createPersorg(persorg, creatorUserId, now) {
    const sql = `
      insert into persorgs (is_organization, name, normal_name, known_for, normal_known_for, website_url, twitter_url, wikipedia_url, creator_user_id, created) 
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      returning *
    `
    const args = [
      persorg.isOrganization,
      cleanWhitespace(persorg.name),
      normalizeText(persorg.name),
      persorg.knownFor,
      normalizeText(persorg.knownFor),
      persorg.websiteUrl,
      persorg.twitterUrl,
      persorg.wikipediaUrl,
      creatorUserId,
      now,
    ]
    return await this.queryOne('createPersorg', sql, args)
  }

  async readEquivalentPersorg(persorg) {
    return await this.queryOne(
      'readEquivalentPersorg',
      `
        select * 
        from persorgs 
          where 
                is_organization = $1
            and normal_name = $2
            and normal_known_for = $3
      `,
      [persorg.isOrganization, normalizeText(persorg.name), normalizeText(persorg.knownFor)]
    )
  }

  async readPersorgForId(persorgId) {
    return await this.queryOne(
      'readPersorgForId',
      `select * from persorgs where persorg_id = $1 and deleted is null`,
      [persorgId]
    )
  }

  async readPersorgsForName(persorgName) {
    return await this.queryMany(
      'readPersorgsForName',
      `select * from persorgs where normal_name = $1 and deleted is null`,
      [normalizeText(persorgName)]
    )
  }

  async readPersorgs() {
    return await this.queryMany(
      'readPersorgs',
      `
        select * 
        from persorgs 
        where deleted is null
        order by created
      `
    )
  }

  async readPersorgsLikeName(persorgName) {
    return await this.queryMany(
      'readPersorgsLikeName',
      `
        select * 
        from persorgs 
          where normal_name ilike '%' || $1 || '%' 
            and deleted is null 
        order by length(name), name
      `,
      [normalizeText(persorgName)]
    )
  }
}