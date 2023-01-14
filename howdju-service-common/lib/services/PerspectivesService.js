exports.PerspectivesService = class PerspectivesService {
  constructor(authDao, perspectivesDao) {
    this.authDao = authDao;
    this.perspectivesDao = perspectivesDao;
  }

  readFeaturedPerspectives(authToken) {
    return this.authDao
      .getUserIdForAuthToken(authToken)
      .then((userId) =>
        this.perspectivesDao.readFeaturedPerspectivesWithVotes({ userId })
      );
  }
};
