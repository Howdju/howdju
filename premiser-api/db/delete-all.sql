delete from actions;
delete from writs;
delete from writ_quotes;
delete from writ_quote_urls;

-- delete from group_permissions;
-- delete from groups;

delete from justification_scores;
delete from justifications;

delete from migration_translations;

-- delete from permissions;

delete from perspectives;
delete from perspective_justifications;
delete from propositions;
delete from proposition_compounds;
delete from proposition_compound_atoms;
delete from taggings;
delete from tags;
delete from tagging_scores;
delete from urls;

-- delete from users;
-- delete from user_auth;

delete from user_auth_tokens;

-- delete from user_external_ids;
-- delete from user_groups;
-- delete from user_permissions;

delete from votes;


alter sequence writs_writ_id_seq restart with 1;
alter sequence writ_quotes_writ_quote_id_seq restart with 1;
-- alter sequence groups_group_id_seq restart with 1;
alter sequence justifications_justification_id_seq restart with 1;
-- alter sequence permissions_permission_id_seq restart with 1;
alter sequence perspectives_perspective_id_seq restart with 1;
alter sequence propositions_proposition_id_seq restart with 1;
alter sequence proposition_compounds_proposition_compound_id_seq restart with 1;
alter sequence tags_tag_id_seq restart with 1;
alter sequence urls_url_id_seq restart with 1;
alter sequence votes_vote_id_seq restart with 1;
