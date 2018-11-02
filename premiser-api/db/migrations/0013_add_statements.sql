

create table if not exists persorgs (
  persorg_id serial primary key,
  is_organization boolean not null,
  name varchar(2048) not null,
  normal_name varchar(2048) not null,
  known_for varchar(4096), -- to distinguish persons having the same or similar names.  Manually curated
  normal_known_for varchar(4096),
  website_url varchar(4096), -- personal website or organization's main website
  twitter_url varchar(4096),
  wikipedia_url varchar(4096),

  creator_user_id integer not null references users(user_id),
  created timestamp not null,
  deleted timestamp
);
create index idx_persorgs_name_english on persorgs using gin (to_tsvector('english', name));
create index if not exists idx_persorgs_name_pattern on persorgs (name varchar_pattern_ops) where deleted is null;

-- create table if not exists persorg_urls (
--   persorg_id integer not null references persorgs(persorg_id),
--   url_id integer not null references urls(url_id),
--   creator_user_id integer not null references users(user_id),
--
--   created timestamp not null,
--   deleted timestamp,
--   primary key (persorg_id, url_id)
-- );

create table if not exists statements (
  statement_id serial primary key,
  speaker_persorg_id integer not null references persorgs(persorg_id),
  sentence_type varchar(64) not null, -- STATEMENT, PROPOSITION
  sentence_id integer not null,
  root_proposition_id integer not null references propositions(proposition_id),

  creator_user_id integer not null references users(user_id),
  created timestamp not null,
  deleted timestamp
);

create unique index idx_statements_speaker_sentence_unique on statements (speaker_persorg_id, sentence_type, sentence_id);
