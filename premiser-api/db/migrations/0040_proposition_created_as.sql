create type proposition_created_as_types as enum ('APPEARANCE', 'QUESTION', 'STATEMENT');

alter table propositions add column created_as_type proposition_created_as_types;
-- The ID of the appearance that this proposition was created as an apparition of.
-- This column is non null iff created_as_type = 'APPEARANCE'.
alter table propositions add column created_as_appearance_id bigint references appearances(appearance_id);
-- The ID of the statement that this proposition was created as a sentence of.
-- This column is non null iff created_as_type = 'STATEMENT'.
alter table propositions add column created_as_statement_id bigint references statements(statement_id);
alter table propositions add check (num_nonnulls(created_as_appearance_id, created_as_statement_id) <= 1);

create type statement_created_as_types as enum ('STATEMENT');

alter table statements add column created_as_type statement_created_as_types;
-- The ID of the statement that this statement was created as a sentence of.
-- This column is non null iff created_as_type = 'STATEMENT'.
alter table statements add column created_as_statement_id bigint references statements(statement_id);
alter table statements add check (num_nonnulls(created_as_statement_id) <= 1);
