-- DO_NOT_MERGE delete

create table if not exists sentence_appearances (
  sentence_appearance_id serial primary key,
  sentence_type varchar(64) not null, -- PROPOSITION, STATEMENT
  sentence_id integer not null,

  -- target might be null if it is source-only
  target_type varchar(64), -- WEBSITE, TWEET, SOURCE
  target_id integer,

  -- source/pincite might be null if the user declines to enter it
  source_id integer references sources(source_id),
  pincite_id integer references pincites(pincite_id),

  creator_user_id integer not null references users(user_id),
  created timestamp not null,
  deleted timestamp
);

create table if not exists website_sentence_targets (
  website_sentence_target_id serial primary key,
  url_id integer not null references urls(url_id)
);
create table if not exists howdju_justification_sentence_targets (
  howdju_justification_sentence_target_id serial primary key
);
create table if not exists tweet_sentence_targets (
  tweet_sentence_target_id serial primary key,
  tweet_id integer not null
);

create table if not exists sentence_appearance_anchors (
  sentence_target_type varchar(64) not null, -- WEBSITE, HOWDJU_JUSTIFICATION, TWEET
  sentence_target_id integer not null,
  anchor_type varchar(64) not null, -- QUOTE_TEXT, IMAGE_REGION, VIDEO_SEGMENT
  anchor_id integer not null
);

create table if not exists quote_text_anchors (
  quote_text_anchor_id serial primary key,
  exact_text varchar(65536) not null,
  prefix_text varchar(65535),
  suffix_text varchar(65536)
);
create table if not exists image_region_anchors (
  image_region_anchor_id serial primary key,
  image_url_id integer references urls(url_id), -- can be null if it is a data: image
  css_selector varchar(1024),
  upper_left integer not null,
  upper_right integer not null,
  lower_left integer not null,
  lower_right integer not null
);
create table if not exists video_segment_anchors (
  video_segment_anchor_id serial primary key,
  video_url_id integer references urls(url_id), -- not sure how this could be null, but maybe if the video data is embedded in the website somehow
  css_selector varchar(1024),
  offset_ms integer not null,
  duration_ms integer -- null indicates the remainder of the video
);


create table if not exists sources (
  source_id serial primary key,
  type varchar(64),

  title varchar(4096),
  author_persorg_id integer references persorgs(persorg_id),
  publishing_organization_persorg_id integer references persorgs(persorg_id),
  created_date timestamp,
  identifier_doi varchar(128),
  identifier_isbn varchar(128),
  identifier_pmid varchar(128),
  identifier_issn varchar(128),
  identifier_pmc varchar(128),
  identifier_oclc varchar(128),
  identifier_bibcode varchar(128),

  creator_user_id integer not null references users(user_id),
  created timestamp not null,
  deleted timestamp
);
-- create table if not exists source_properties (
--   source_id integer not null references sources(source_id),
--   property_type varchar(1024), -- TITLE, DOI, ISBN, PMID, ISSN, PMC, OCLC, BIBCODE
--   property_value varchar(8192)
-- );
-- create table if not exists source_related_persorgs (
--   source_id integer not null references sources(source_id),
--   persorg_id integer not null references persorgs(persorg_id),
--   relation_type varchar(1024) not null -- AUTHOR, PUBLISHING_ORGANIZATION
-- )

create table if not exists pincites (
  pincite_id serial primary key,
  source_id integer references sources(source_id) not null,

  text varchar(4096) not null,

  creator_user_id integer not null references users(user_id),
  created timestamp not null,
  deleted timestamp
);
