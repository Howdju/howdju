-- premiser_admin
grant all privileges on schema public to premiser_admin;
grant all privileges on all tables in schema public to premiser_admin;
grant all privileges on all sequences in schema public to premiser_admin;
alter default privileges in schema public grant all privileges on tables to premiser_admin;
alter default privileges in schema public grant all privileges on sequences to premiser_admin;

-- premiser_api
grant select, insert, update, delete on all tables in schema public to premiser_api;
grant all privileges on all sequences in schema public to premiser_api;
alter default privileges in schema public grant select, insert, update, delete on tables to premiser_api;
alter default privileges in schema public grant all privileges on sequences to premiser_api;
