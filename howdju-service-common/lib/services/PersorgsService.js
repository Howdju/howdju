exports.PersorgsService = class PersorgsService {
  constructor(logger, persorgsDao) {
    this.logger = logger
    this.persorgsDao = persorgsDao
  }

  async readPersorgForId(persorgId) {
    return await this.persorgsDao.readPersorgForId(persorgId)
  }

  async readOrCreateValidPersorgAsUser(persorg, userId, now) {
    if (persorg.id) {
      return {
        isExtant: true,
        persorg: await this.readPersorgForId(persorg.id),
      }
    }

    let dbPersorg = await this.persorgsDao.readEquivalentPersorg(persorg)
    if (dbPersorg) {
      return {
        isExtant: true,
        persorg: dbPersorg,
      }
    }

    dbPersorg = await this.persorgsDao.createPersorg(persorg, userId, now)

    return {
      isExtant: false,
      persorg: dbPersorg,
    }
  }
}
