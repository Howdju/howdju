-- I don't know why I limited the unique index on IDs to undeleted.  IDs should always be unique even if deleted.
drop index idx_users_user_id;
create unique index idx_users_user_id on users (user_id);
drop index idx_justification_basis_compounds_compounds_id;
create unique index if not exists idx_justification_basis_compounds_compounds_id
  on justification_basis_compounds (justification_basis_compound_id);
drop index idx_justifications_justification_id;
create unique index if not exists idx_justifications_justification_id
  on justifications (justification_id);
drop index idx_source_excerpt_paraphrases_source_excerpt_paraphrase_id;
create unique index if not exists idx_source_excerpt_paraphrases_source_excerpt_paraphrase_id
  on source_excerpt_paraphrases (source_excerpt_paraphrase_id);
drop index idx_statement_compounds_statement_compound_id;
create unique index if not exists idx_proposition_compounds_proposition_compound_id
  on proposition_compounds (proposition_compound_id);
drop index idx_statements_statement_id;
create unique index if not exists idx_propositions_proposition_id on propositions (proposition_id);
drop index idx_tags_tag_id;
create unique index if not exists idx_tags_tag_id on tags (tag_id);
drop index idx_urls_url_id;
create unique index if not exists idx_urls_url_id on urls (url_id);
-- this index just doesn't make sense to me now
drop index idx_user_auth_tokens_user_id;
drop index idx_writ_quotes_writ_quote_id;
create unique index if not exists idx_writ_quotes_writ_quote_id on writ_quotes (writ_quote_id);
drop index idx_writs_writ_id;
create unique index if not exists idx_writs_writ_id on writs (writ_id);