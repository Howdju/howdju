create table if not exists migration_translations (
  old_table_name varchar(64),
  new_table_name varchar(64),
  old_id varchar(64),
  new_id varchar(64)
);

create table if not exists users (
  user_id serial,
  email varchar(2048),
  first_name varchar(128),
  last_name varchar(128),
  phone_number varchar(64),
  hash varchar(4096),
  creator_user_id integer,
  is_active bit,
  last_login timestamp,
  created timestamp,
  deleted timestamp,
);

create table if not exists user_analytics (
  user_id integer,
  google_analytics_id varchar(128)
);

create table if not exists actions (
  user_id integer, -- User who acted
  action_type varchar(128), -- CREATE, DELETE, MODIFY
  target_id integer, -- Thing acted upon
  target_type varchar(64),
  subject_id integer, -- The thing used to act, if applicable (e.g. URL, when associated with a target CITATION_REFERENCE)
  subject_type varchar(64),
  tstamp timestamp
);

create table if not exists statements (
  statement_id serial,
  text varchar(2048),
  normal_text varchar(2048),
  creator_user_id integer,
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
  basis_type varchar(64), -- 'STATEMENT_COMPOUND', 'CITATION_REFERENCE'
  basis_id integer,
  polarity varchar(32), -- 'POSITIVE' or 'NEGATIVE'.  target_type='JUSTIFICATION' implies polarity='NEGATIVE'
  creator_user_id integer,
  created timestamp,
  deleted timestamp
);

create table if not exists statement_compounds (
  statement_compound_id serial,
  creator_user_id integer,
  created timestamp,
  deleted timestamp
);

create table if not exists statement_compound_atoms (
  statement_compound_id integer,
  statement_id integer,
  order_position integer
);

create table if not exists citation_references (
  citation_reference_id serial,
  quote varchar(65536),
  citation_id integer,
  creator_user_id integer,
  created timestamp,
  deleted timestamp
);

create table if not exists citations (
  citation_id serial,
  text varchar(2048),
  normal_text varchar(2048),
  creator_user_id integer,
  created timestamp,
  deleted timestamp
);

-- Both citation_urls and citation_reference_urls might make sense;
-- citation_urls would refer to the full source while citation_reference_urls would point to the quote
create table if not exists citation_reference_urls (
  citation_reference_id integer,
  url_id integer,
  creator_user_id integer,
  created timestamp,
  deleted timestamp
);

create table if not exists urls (
  url_id serial,
  url varchar(65536),
  creator_user_id integer,
  created timestamp,
  deleted timestamp
);

create table if not exists tags (
  tag_id serial,
  type varchar(64), -- statements: SUBJECT, TIME, LOCATION; justifications: LOGICAL_FALLACY
  text varchar(1024),
  creator_user_id integer,
  created timestamp,
  deleted timestamp
);

create table if not exists taggings (
  tagging_id serial,
  tag_id integer,
  target_id integer,
  target_type varchar(64),
  creator_user_id integer,
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
  score float
);

create table if not exists tagging_scores (
  tagging_id integer,
  score_type varchar(64),
  score float
);

create table if not exists groups (
  group_id serial,
  name varchar(256),
  creator_user_id integer,
  created timestamp,
  deleted timestamp
);

create table if not exists user_groups (
  user_id integer,
  group_id integer,
  creator_user_id integer,
  created timestamp,
  deleted timestamp
);

create table if not exists permissions (
  permission_id serial,
  name varchar(256),
  comment varchar(2048),
  creator_user_id integer,
  created timestamp,
  deleted timestamp
);

create table if not exists user_permissions (
  user_id integer,
  permission_id integer
  creator_user_id integer,
  created timestamp,
  deleted timestamp
);

create table if not exists group_permissions (
  group_id integer,
  permission_id integer,
  creator_user_id integer,
  created timestamp,
  deleted timestamp
);

create table if not exists authentication_tokens (
  user_id integer,
  token varchar(1024),
  created timestamp,
  expires timestamp,
  deleted timestamp
);
