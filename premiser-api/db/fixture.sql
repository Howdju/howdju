insert into statements (statement_id, text, created) values
(1, 'The American Health Care Reform Act of 2017 (H.R.277) is an improvement over The Affordable Care Act', NOW()),
(2, 'The American Health Care Reform Act of 2017 will reduce federal deficits by $337 by 2026', NOW()),
(3, 'The AHCA will uninsure 14 million people by 2018', NOW()),
(4, 'The AHCA is shorter than the ACA', NOW()),
(5, 'The AHCA removes the penalty for choosing not to have health insurance', NOW()),
(6, 'The removal of the individual mandate will drive up insurance costs and emergency care costs', NOW()),
(7, 'The AHCA is only so much shorter because it incorporates or relies upon the existing ACA laws', NOW());

insert into justifications (justification_id, root_statement_id, target_type, target_id, basis_type, basis_id, polarity, created) values
(1, 1, 'STATEMENT', 1, 'STATEMENT', 2, 'POSITIVE', NOW()),
(2, 1, 'STATEMENT', 1, 'STATEMENT', 3, 'NEGATIVE', NOW()),
(3, 1, 'STATEMENT', 1, 'STATEMENT', 4, 'POSITIVE', NOW()),
(4, 1, 'STATEMENT', 1, 'STATEMENT', 5, 'POSITIVE', NOW()),
(5, 1, 'STATEMENT', 1, 'STATEMENT', 6, 'NEGATIVE', NOW()),
(6, 1, 'STATEMENT', 1, 'REFERENCE', 1, 'NEGATIVE', NOW()),
(7, 1, 'JUSTIFICATION', 3, 'STATEMENT', 7, 'NEGATIVE', NOW());

insert into citations (citation_id, text, created) values
(1, 'Tax Credits under the Affordable Care Act vs. the American Health Care Act: An Interactive Map', NOW());

insert into "references" (reference_id, citation_id, created, quote) values
(1, 1, NOW(), 'Generally, people who are older, lower-income, or live in high-premium areas (like Alaska and Arizona) receive larger tax credits under the ACA than they would under the American Health Care Act replacement.');

insert into urls (url_id, url, created) values
(1, 'http://kff.org/interactive/tax-credits-under-the-affordable-care-act-vs-replacement-proposal-interactive-map/', NOW());

insert into reference_urls (reference_id, url_id, created) values
(1, 1, NOW());

insert into permissions (name) values
('CREATE_USER');

insert into groups (name, created) values
('admins', NOW());