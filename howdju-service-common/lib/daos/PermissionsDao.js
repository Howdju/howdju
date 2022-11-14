const toString = require("lodash/toString");

const { requireArgs } = require("howdju-common");

exports.PermissionsDao = class PermissionsDao {
  constructor(logger, database) {
    this.logger = logger;
    this.database = database;
  }

  userHasPermission(userId, permission) {
    requireArgs({ userId, permission });

    const sql = `
      with
        permission AS (
          SELECT * from permissions where name = $2
        )
        , "user" AS (
          select *
          from users
            where
                user_id = $1
            and deleted is null
        )
      select count(*) > 0 as has_perm
      from "user"
          left join permission on true
          -- try and find the permission by user_permissions
          left join user_permissions up using (user_id, permission_id)
          -- or by group_permissions
          left join user_groups ug using (user_id)
          left join group_permissions gp using (group_id, permission_id)
        where
              (up.permission_id is not null or gp.permission_id is not null)
          and up.deleted is null
          and ug.deleted is null
          and gp.deleted is null
    `;
    return this.database
      .query("userHasPermission", sql, [userId, permission])
      .then(({ rows: [{ has_perm: hasPerm }] }) => hasPerm);
  }

  getUserIdWithPermission(authToken, permission) {
    const sql = `
      with
        permission AS (
          SELECT * from permissions where name = $2
        )
        , "user" AS (
          select users.*
          from user_auth_tokens auth join users using (user_id)
            where
                auth.auth_token = $1
            and auth.expires > $3
            and auth.deleted is null
            and users.deleted is null
        )
      select distinct
          "user".user_id
        , coalesce(up.permission_id, gp.permission_id) is not null as has_perm
      from "user"
          left join permission on true
          -- try and find the permission by user_permissions
          left join user_permissions up using (user_id, permission_id)
          -- or by group_permissions
          left join user_groups ug using (user_id)
          left join group_permissions gp using(group_id, permission_id)
        where
              up.deleted is null
          and ug.deleted is null
          and gp.deleted is null
    `;
    return this.database
      .query("getUserIdWithPermission", sql, [
        authToken,
        permission,
        new Date(),
      ])
      .then(({ rows }) => {
        if (rows.length < 1) {
          return {};
        }
        if (rows.length > 1) {
          this.logger.error(
            `Multiple rows for getUserIdWithPermission ${rows.length}`
          );
        }
        const [{ user_id: userId, has_perm: hasPermission }] = rows;
        return { userId: toString(userId), hasPermission };
      });
  }
};
