CREATE TABLE statements (
  statement_id SERIAL,
  text varchar(2048)
);

CREATE TABLE justifications (
  justification_id SERIAL,
  target_type varchar(32), -- 'STATEMENT' or 'JUSTIFICATION'
  target_id integer,
  basis_type varchar(32), -- 'STATEMENT' or 'REFERENCE'
  basis_id integer,
  polarity varchar(32) -- 'POSITIVE' or 'NEGATIVE'.  target_type='JUSTIFICATION' implies polarity='NEGATIVE'
);

CREATE TABLE "references" (
  reference_id SERIAL,
  quote varchar(65536),
  citation_id integer
);

CREATE TABLE citations (
  citation_id SERIAL,
  text varchar(2048)
);

CREATE TABLE reference_urls (
  reference_id integer,
  url_id integer
);

CREATE TABLE urls (
  url_id SERIAL,
  url varchar(65536)
);

CREATE TABLE tags (
  tag_id SERIAL,
  type varchar(32), -- statements: SUBJECT, TIME, LOCATION; justifications: LOGICAL_FALLACY
  text varchar(1024)
);

CREATE TABLE taggings (
  tagging_id SERIAL,
  tag_id integer,
  target_id integer,
  target_type varchar(32)
);

CREATE TABLE justification_votes (
  justification_vote_id SERIAL,
  target_id integer,
  polarity varchar(32)
);

CREATE TABLE tagging_votes (
  tagging_vote_id SERIAL,
  target_id integer,
  polarity varchar(32)
);

CREATE TABLE justification_scores (
  justification_id integer,
  score_type varchar(32), -- GLOBAL_VOTE_SUM
  score FLOAT
);

CREATE TABLE tagging_scores (
  tagging_id integer,
  score_type varchar(32),
  score float
);
