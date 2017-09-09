-- New type of justification basis.  This one is intended to be an all-encompassing compound of any type of atom that
-- could be mixed together
create table compound_justification_bases (
  compound_justification_basis_id serial,
  creator_user_id integer,
  created timestamp,
  deleted timestamp
);

-- For now, we can mix statements or paraphrasing statements.  A future type of justification basis might be Text, but
-- I'm not sure that it will be mixed with other types, since it will be long and doing its own thing.
create table compound_justification_basis_atoms (
  compound_justification_basis_atom_id serial,
  atom_type varchar(64), -- STATEMENT or SOURCE_EXCERPT_PARAPHRASE
  atom_entity_id integer,
  order_position integer
);

-- The new atom type is also polymorphic.  It is any excerpt of a source.  Source types might be textual, image, or video.
-- Basically whatever form of media.  I guess additional types might be data-based, like tabular data, mathematical equations.
-- E.g., the source type might be 'data' or 'tabular_data', and then an excerpt might be a math formula that extracts
-- certain data from the source and produces some result such as a number.  That would be cool!
create table source_excerpt_paraphrases (
  source_excerpt_paraphrase_id serial,
  paraphrasing_statement_id integer,
  source_excerpt_id integer,
  source_excerpt_type varchar(64) -- TEXTUAL_SOURCE_QUOTE, IMAGE_SOURCE_REGION, VIDEO_SOURCE_SEGMENT, etc.
);

-- Rename citation references and citations to match the new naming
alter table citation_references rename to textual_source_quotes;
alter table textual_source_quotes rename column citation_reference_id to textual_source_quote_id;
alter table textual_source_quotes rename column citation_id to textual_source_id;

alter table citation_reference_urls rename to textual_source_quote_urls;
alter table citation_reference_urls rename column citation_reference_id to textual_source_quote_id;

alter table citations rename to textual_sources;
alter table textual_sources rename column citation_id to textual_source_id;

-- Update CITATION_REFERENCE to TEXTUAL_SOURCE_QUOTE
update justifications set basis_type = 'TEXTUAL_SOURCE_QUOTE' where basis_type = 'CITATION_REFERENCE'
