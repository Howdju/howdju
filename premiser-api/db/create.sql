create table if not exists actions (
  user_id integer, -- User who acted
  action_type varchar(128), -- CREATE, DELETE, MODIFY
  target_id integer, -- Thing acted upon
  target_type varchar(64),
  tstamp timestamp
);

create table if not exists statements (
  statement_id serial,
  text varchar(2048),
  created timestamp,
  deleted timestamp
);

create table if not exists justifications (
  justification_id serial,
  -- convenient way to retrieve all justifications for the statement justifications page.
  -- when target_type = 'STATEMENT", equals target_id.  When target_type = 'JUSTIFICATION',
  -- equals the target_id of the nearest parent justification having target_type = 'STATEMENT'
  root_statement_id integer,
  target_type varchar(64), -- 'STATEMENT' or 'JUSTIFICATION'
  target_id integer,
  basis_type varchar(64), -- 'STATEMENT' or 'REFERENCE'
  basis_id integer,
  polarity varchar(32), -- 'POSITIVE' or 'NEGATIVE'.  target_type='JUSTIFICATION' implies polarity='NEGATIVE'
  created timestamp,
  deleted timestamp
);

create table if not exists "references" (
  reference_id serial,
  quote varchar(65536),
  citation_id integer,
  created timestamp,
  deleted timestamp
);

create table if not exists citations (
  citation_id serial,
  text varchar(2048),
  created timestamp,
  deleted timestamp
);

create table if not exists reference_urls (
  reference_id integer,
  url_id integer,
  created timestamp,
  deleted timestamp
);

create table if not exists urls (
  url_id serial,
  url varchar(65536),
  created timestamp,
  deleted timestamp
);

create table if not exists tags (
  tag_id serial,
  type varchar(64), -- statements: SUBJECT, TIME, LOCATION; justifications: LOGICAL_FALLACY
  text varchar(1024),
  created timestamp,
  deleted timestamp
);

create table if not exists taggings (
  tagging_id serial,
  tag_id integer,
  target_id integer,
  target_type varchar(64),
  created timestamp,
  deleted timestamp
);

create table if not exists votes (
  vote_id serial,
  user_id integer,
  target_type varchar(32), -- JUSTIFICATION, TAGGING
  target_id integer,
  polarity varchar(32), -- POSITIVE, NEGATIVE
  created timestamp,
  deleted timestamp
);

create table if not exists justification_scores (
  justification_id integer,
  score_type varchar(64), -- GLOBAL_VOTE_SUM
  score FLOAT
);

create table if not exists tagging_scores (
  tagging_id integer,
  score_type varchar(64),
  score float
);

create table if not exists users (
  user_id serial,
  email varchar(2048),
  hash varchar(4096),
  created timestamp,
  deleted timestamp
);

create table if not exists groups (
  group_id serial,
  name varchar(256),
  created timestamp,
  deleted timestamp
);

create table if not exists user_groups (
  user_id integer,
  group_id integer
);

create table if not exists permissions (
  permission_id serial,
  name varchar(256),
  comment varchar(2048)
);

create table if not exists user_permissions (
  user_id integer,
  permission_id integer
);

create table if not exists group_permissions (
  group_id integer,
  permission_id integer
);

create table if not exists authentication_tokens (
  user_id integer,
  token varchar(1024),
  created timestamp,
  expires timestamp,
  deleted timestamp
);