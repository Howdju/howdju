delete from actions;
delete from citations;
delete from citation_references;
delete from citation_reference_urls;
delete from group_permissions;
delete from groups;
delete from justification_scores;
delete from justifications;

-- delete from migration_translations;

delete from permissions;
delete from perspectives;
delete from perspective_justifications;
delete from statements;
delete from statement_compounds;
delete from statement_compound_atoms;
delete from taggings;
delete from tags;
delete from tagging_scores;
delete from urls;

-- delete from users;
-- delete from user_auth;

delete from user_auth_tokens;

-- delete from user_external_ids;

delete from user_groups;
delete from user_permissions;
delete from votes;


alter sequence citations_citation_id_seq restart with 1;
alter sequence citation_references_citation_reference_id_seq restart with 1;
alter sequence groups_group_id_seq restart with 1;
alter sequence justifications_justification_id_seq restart with 1;
alter sequence permissions_permission_id_seq restart with 1;
alter sequence perspectives_perspective_id_seq restart with 1;
alter sequence statements_statement_id_seq restart with 1;
alter sequence statement_compounds_statement_compound_id_seq restart with 1;
alter sequence tags_tag_id_seq restart with 1;
alter sequence urls_url_id_seq restart with 1;
alter sequence votes_vote_id_seq restart with 1;