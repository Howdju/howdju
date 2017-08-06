insert into permissions (permission_id, name, comment) values
(1, 'CREATE_USER', 'can create new users'),
(2, 'EDIT_ANY_ENTITY', 'can edit or delete any entity');
select setval('permissions_permission_id_seq', (select max(permission_id) from permissions));

insert into groups (group_id, name, created) values
(1, 'admins', NOW());
select setval('groups_group_id_seq', (select max(group_id) from groups));

insert into group_permissions (group_id, permission_id) values
(1, 1),
(1, 2);