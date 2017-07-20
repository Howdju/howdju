delete from migration_translations;
delete from users where user_id <> 1;

alter sequence users_user_id_seq restart with 2;