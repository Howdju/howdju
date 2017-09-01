const {
  AuthenticationError,
  AuthorizationError,
} = require('../serviceErrors')

exports.PermissionsService = class PermissionsService {

  constructor(permissionsDao) {
    this.permissionsDao = permissionsDao
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
}
