const {
  AuthenticationError,
  AuthorizationError,
} = require('../serviceErrors')

exports.PermissionsService = class PermissionsService {

  constructor(permissionsDao, userPermissionsDao) {
    this.permissionsDao = permissionsDao
    this.userPermissionsDao = userPermissionsDao
  }

  readUserIdHavingPermissionForAuthToken(authToken, permission) {
    return this.permissionsDao.getUserIdWithPermission(authToken, permission)
      .then( ({userId, hasPermission}) => {
        if (!userId) {
          throw new AuthenticationError()
        }
        if (!hasPermission) {
          throw new AuthorizationError(permission)
        }
        return userId
      })
  }

  addPermissionsToUser(user, permissionNames) {
    return this.userPermissionsDao.addPermissionsToUser(user, permissionNames)
  }
}
