-- New type of justification basis.  This one is intended to be an all-encompassing compound of any type of atom that
-- could be mixed together
create table justification_basis_compounds (
  justification_basis_compound_id serial,
  creator_user_id integer,
  created timestamp,
  deleted timestamp
);

-- For now, we can mix statements or paraphrasing statements.  A future type of justification basis might be Text, but
-- I'm not sure that it will be mixed with other types, since it will be long and doing its own thing.
create table justification_basis_compounds_atoms (
  justification_basis_compounds_atom_id serial,
  justification_basis_compound_id integer,
  entity_type varchar(64), -- STATEMENT or SOURCE_EXCERPT_PARAPHRASE
  entity_id integer,
  order_position integer
);

-- The new atom type is also polymorphic.  It is any excerpt of a source.  Source types might be textual, image, or video.
-- Basically whatever form of media.  I guess additional types might be data-based, like tabular data, mathematical equations.
-- E.g., the source type might be 'data' or 'tabular_data', and then an excerpt might be a math formula that extracts
-- certain data from the source and produces some result such as a number.  That would be cool!
create table source_excerpt_paraphrases (
  source_excerpt_paraphrase_id serial,
  paraphrasing_statement_id integer,
  source_excerpt_type varchar(64), -- WRIT_QUOTE, IMAGE_REGION, VIDEO_SEGMENT, etc.
  source_excerpt_id integer
);

-- Rename citation references and citations to match the new naming
alter table citation_references rename to writ_quotes;
alter table writ_quotes rename column citation_reference_id to writ_quote_id;
alter table writ_quotes rename column citation_id to writ_id;
alter table writ_quotes rename column quote to quote_text;

alter table citation_reference_urls rename to writ_quote_urls;
alter table writ_quote_urls rename column citation_reference_id to writ_quote_id;

alter table citations rename to writs;
alter table writs rename column citation_id to writ_id;
alter table writs rename column text to title;
alter table writs rename column normal_text to normal_title;


update justifications set basis_type = 'WRIT_QUOTE' where basis_type = 'CITATION_REFERENCE';

alter index statements_idx rename to statement_text_fulltext_idx;
drop index citations_idx;
create index writ_title_fulltext_idx ON writs USING GIN (to_tsvector('english', title));