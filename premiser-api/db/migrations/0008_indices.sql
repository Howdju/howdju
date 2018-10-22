create unique index if not exists idx_group_permissions_group_id_permission_id
  on group_permissions (group_id, permission_id) where deleted is null;
create unique index if not exists idx_justification_basis_compound_atoms_atom_id
  on justification_basis_compound_atoms (justification_basis_compound_atom_id);
create unique index if not exists idx_justification_basis_compounds_compounds_id
  on justification_basis_compounds (justification_basis_compound_id) where deleted is null;
create unique index if not exists idx_justifications_justification_id
  on justifications (justification_id) where deleted is null;
create unique index if not exists idx_justification_scores_justification_id
  on justification_scores (justification_id) where deleted is null;
create unique index if not exists idx_permissions_permission_name on permissions ("name") where deleted is null;
create unique index if not exists idx_source_excerpt_paraphrases_source_excerpt_paraphrase_id
  on source_excerpt_paraphrases (source_excerpt_paraphrase_id) where deleted is null;
create        index if not exists idx_statement_compound_atoms_statement_compound_atom_id
  on statement_compound_atoms (statement_compound_id);
create unique index if not exists idx_statement_compounds_statement_compound_id
  on statement_compounds (statement_compound_id) where deleted is null;
create unique index if not exists idx_statement_tag_scores_statement_id
  on statement_tag_scores (score_type, statement_id, tag_id) where deleted is null;
create unique index if not exists idx_statements_statement_id
  on statements (statement_id) where deleted is null;
create unique index if not exists idx_tags_tag_id
  on tags (tag_id) where deleted is null;
create unique index if not exists idx_urls_url_id
  on urls (url_id) where deleted is null;
create unique index if not exists idx_user_auth_user_id on user_auth (user_id, hash_type);
create unique index if not exists idx_user_auth_tokens_user_id
  on user_auth_tokens (user_id) where deleted is null;
create unique index if not exists idx_user_auth_tokens_user_id
  on user_auth_tokens (user_id, auth_token, expires) where deleted is null;
create unique index if not exists idx_user_external_ids_user_id
  on user_external_ids (user_id);
create        index if not exists idx_user_groups_user_id on user_groups (user_id) where deleted is null;
create unique index if not exists idx_user_permissions_user_id_permission_id
  on user_permissions (user_id, permission_id) where deleted is null;
create unique index if not exists idx_users_user_id on users (user_id) where deleted is not null;
create unique index if not exists idx_users_email on users (email) where deleted is null;
create        index if not exists idx_writ_quote_urls_writ_quote_id
  on writ_quote_urls (writ_quote_id) where deleted is null;
create unique index if not exists idx_writ_quotes_writ_quote_id
  on writ_quotes (writ_quote_id) where deleted is null;
create unique index if not exists idx_writs_writ_id on writs (writ_id) where deleted is null;

-- select normal_text, count(*) from propositions group by normal_text having count(*) > 1;
-- select normal_quote_text, count(*) from writ_quotes group by normal_quote_text having count(*) > 1;
create unique index if not exists idx_tags_normal_name on tags (normal_name) where deleted is null;
create unique index if not exists idx_statements_normal_text on statements (normal_text) where deleted is null;
create unique index if not exists idx_writs_normal_title on writs (normal_title) where deleted is null;
create unique index if not exists idx_writ_quotes_normal_quote_text
  on writ_quotes (writ_id, normal_quote_text) where deleted is null;

-- support regex and ilike queries
-- (necessary when locale is not c locale; we are show lc_collate; en_us.utf-8)
create index if not exists idx_tags_normal_name_pattern on tags (normal_name varchar_pattern_ops) where deleted is null;
create index if not exists idx_statements_text_pattern on statements ("text" varchar_pattern_ops) where deleted is null;
create index if not exists idx_writs_title_pattern on writs (title varchar_pattern_ops) where deleted is null;
create index if not exists idx_writ_quotes_quote_text_pattern on writ_quotes (quote_text varchar_pattern_ops) where deleted is null;
create index if not exists idx_urls_url_pattern on urls (url varchar_pattern_ops) where deleted is null;
