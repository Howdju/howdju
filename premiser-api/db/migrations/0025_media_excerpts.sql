alter table urls alter column url_id type bigint;
alter table urls add primary key (url_id);
alter table urls alter column url set not null;
alter table urls add check (url != '');
alter table urls add column canonical_url varchar(65536) check (canonical_url != '');
update urls set canonical_url = url;
alter table urls alter column canonical_url set not null;

create table media_excerpts (
  media_excerpt_id bigserial primary key,
  quotation varchar(4096) check (quotation != ''),
  normal_quotation varchar(4096) check (normal_quotation != ''),

  creator_user_id bigint not null references users(user_id),
  created timestamp not null,
  deleted timestamp
);

-- The same URL can be related to a media excerpt multiple times if it uses different anchors.
create table url_locators (
  url_locator_id bigserial primary key,
  media_excerpt_id bigint not null references media_excerpts,
  url_id bigint not null references urls,

  creator_user_id bigint not null references users(user_id),
  created timestamp not null,
  deleted timestamp
);

-- If multiple dom_anchors are related to the same url_locator, they represent ranges
-- within the same URL that taken together form the media excerpt.
create table dom_anchors (
  -- A DOM anchor belongs to a URL locator.
  url_locator_id bigint not null references url_locators,

  exact_text varchar(65536) check (exact_text != ''),
  prefix_text varchar(65535) check (prefix_text != ''),
  suffix_text varchar(65536) check (suffix_text != ''),
  start_offset integer check (start_offset >= 0),
  end_offset integer check (end_offset >= start_offset),

  constraint unique_anchor unique (url_locator_id, exact_text, prefix_text, suffix_text, start_offset, end_offset, deleted),

  creator_user_id bigint not null references users(user_id),
  created timestamp not null,
  deleted timestamp
);

create table sources (
  source_id bigserial primary key,

  description_apa varchar(2048) not null check (description_apa != ''),
  normal_description_apa varchar(2048) not null check (normal_description_apa != ''),

  identifier_doi varchar(128) check (identifier_doi != ''),
  identifier_isbn varchar(128) check (identifier_isbn != ''),
  identifier_pmid varchar(128) check (identifier_pmid != ''),
  identifier_issn varchar(128) check (identifier_issn != ''),
  identifier_pmc varchar(128) check (identifier_pmc != ''),
  identifier_oclc varchar(128) check (identifier_oclc != ''),
  identifier_bibcode varchar(128) check (identifier_bibcode != ''),

  creator_user_id bigint references users(user_id),
  created timestamp not null,
  deleted timestamp
);

CREATE INDEX sources_description_apa_english_idx ON sources USING GIN (to_tsvector('english', description_apa));

-- Citations connect a media excerpt to a source, possibly at a pincited location.
create table media_excerpt_citations (
  media_excerpt_id bigint not null references media_excerpts,
  source_id bigint not null references sources,

  pincite varchar(128) check (pincite != ''),
  normal_pincite varchar(128) check (normal_pincite != ''),

  creator_user_id bigint not null references users(user_id),
  created timestamp not null,
  deleted timestamp,

  constraint unq unique (media_excerpt_id, source_id, normal_pincite, deleted)
);

create table media_excerpt_speakers(
  media_excerpt_id bigint not null references media_excerpts,
  speaker_persorg_id bigint not null references persorgs(persorg_id),
  primary key (media_excerpt_id, speaker_persorg_id),

  creator_user_id bigint references users(user_id),
  created timestamp not null,
  deleted timestamp
);
