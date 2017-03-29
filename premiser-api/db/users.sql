-- As premiser_rds
create user premiser_admin;
\password premiser_admin
grant all on schema public to premiser_admin;

create user premiser_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO premiser_api;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO premiser_api;

-- create.sql

-- As premiser_admin
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO premiser_api;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO premiser_api;

-- seed.sql