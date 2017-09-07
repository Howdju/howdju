exports.GroupsService = class GroupsService {
  constructor(logger, userGroupsDao) {
    this.logger = logger
    this.userGroupsDao = userGroupsDao
  }

  addUserToGroups(user, groupNames) {
    return this.userGroupsDao.addUserToGroups(user, groupNames)
  }
}

