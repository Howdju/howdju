const {query, queries} = require('./../db')

class PermissionsDao {
  userHasPermission(userId, permission) {
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
          left join group_permissions gp using(group_id, permission_id)
        where
              (up.permission_id is not null or gp.permission_id is not null)
          and up.deleted is null
          and ug.deleted is null
          and gp.deleted is null
    `
    return query(sql, [userId, permission])
        .then( ({rows: [{has_perm: hasPerm}]}) => hasPerm )
  }
}

module.exports = new PermissionsDao()