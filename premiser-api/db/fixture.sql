insert into statements (statement_id, text, created) values
(1, 'The American Health Care Reform Act of 2017 (H.R.277) is an improvement over The Affordable Care Act', NOW()),
(2, 'The American Health Care Reform Act of 2017 will reduce federal deficits by $337 by 2026', NOW()),
(3, 'The AHCA will uninsure 14 million people by 2018', NOW()),
(4, 'The AHCA is shorter than the ACA', NOW()),
(5, 'The AHCA removes the penalty for choosing not to have health insurance', NOW()),
(6, 'The removal of the individual mandate will drive up insurance costs and emergency care costs', NOW()),
(7, 'The AHCA is only so much shorter because it incorporates or relies upon the existing ACA laws', NOW());
select setval('statements_statement_id_seq', (select max(statement_id) from statements));

insert into justifications (justification_id, root_statement_id, target_type, target_id, basis_type, basis_id, polarity, created) values
(1, 1, 'STATEMENT', 1, 'STATEMENT', 2, 'POSITIVE', NOW()),
(2, 1, 'STATEMENT', 1, 'STATEMENT', 3, 'NEGATIVE', NOW()),
(3, 1, 'STATEMENT', 1, 'STATEMENT', 4, 'POSITIVE', NOW()),
(4, 1, 'STATEMENT', 1, 'STATEMENT', 5, 'POSITIVE', NOW()),
(5, 1, 'STATEMENT', 1, 'STATEMENT', 6, 'NEGATIVE', NOW()),
(6, 1, 'STATEMENT', 1, 'CITATION_REFERENCE', 1, 'NEGATIVE', NOW()),
(7, 1, 'JUSTIFICATION', 3, 'STATEMENT', 7, 'NEGATIVE', NOW());
select setval('justifications_justification_id_seq', (select max(justification_id) from justifications));

insert into citations (citation_id, text, created) values
(1, 'Tax Credits under the Affordable Care Act vs. the American Health Care Act: An Interactive Map', NOW());
select setval('citations_citation_id_seq', (select max(citation_id) from citations));

insert into citation_references (citation_reference_id, citation_id, created, quote) values
(1, 1, NOW(), 'Generally, people who are older, lower-income, or live in high-premium areas (like Alaska and Arizona) ' ||
 'receive larger tax credits under the ACA than they would under the American Health Care Act replacement.');
select setval('citation_references_citation_reference_id_seq', (select max(citation_reference_id) from citation_references));

insert into urls (url_id, url, created) values
(1, 'http://kff.org/interactive/tax-credits-under-the-affordable-care-act-vs-replacement-proposal-interactive-map/', NOW());
select setval('urls_url_id_seq', (select max(url_id) from urls));

insert into reference_urls (reference_id, url_id, created) values
(1, 1, NOW());

insert into permissions (permission_id, name, comment) values
(1, 'CREATE_USER', 'can create new users'),
(2, 'DELETE_STATEMENTS', 'can delete any statement'),
(3, 'DELETE_JUSTIFICATIONS', 'can delete any justification');
select setval('permissions_permission_id_seq', (select max(permission_id) from permissions));

insert into groups (group_id, name, created) values
(1, 'admins', NOW());
select setval('groups_group_id_seq', (select max(group_id) from groups));

insert into group_permissions (group_id, permission_id) values
(1, 1),
(1, 2),
(1, 3);