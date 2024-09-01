import { AuthToken, EntityId, makeModelErrors, User } from "howdju-common";

import { Permission } from "../permissions";
import { PermissionsDao, UserPermissionsDao } from "../daos";
import { UnauthorizedError, UnauthenticatedError } from "../serviceErrors";

export class PermissionsService {
  constructor(
    private permissionsDao: PermissionsDao,
    private userPermissionsDao: UserPermissionsDao
  ) {}

  async readUserIdHavingPermissionForAuthToken(
    authToken: AuthToken,
    permission: Permission
  ) {
    const { userId, hasPermission } =
      await this.permissionsDao.getUserIdWithPermission(authToken, permission);

    if (!userId) {
      throw new UnauthenticatedError();
    }
    if (!hasPermission) {
      throw new UnauthorizedError(
        makeModelErrors((x) => x(`User lacks permission`))
      );
    }
    return userId;
  }

  addPermissionsToUser(user: User, permissionNames: Permission[]) {
    return this.userPermissionsDao.addPermissionsToUser(user, permissionNames);
  }

  userHasPermission(userId: EntityId, permission: Permission) {
    return this.permissionsDao.userHasPermission(userId, permission);
  }
}
