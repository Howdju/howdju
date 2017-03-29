INSERT INTO statements (text) VALUES
('The American Health Care Reform Act of 2017 (H.R.277) is an improvement over The Affordable Care Act'),
('The American Health Care Reform Act of 2017 will reduce federal deficits by $337 by 2026'),
('The AHCA will uninsure 14 million people by 2018'),
('The AHCA is shorter than the ACA'),
('The AHCA removes the penalty for choosing not to have health insurance'),
('The removal of the individual mandate will drive up insurance costs and emergency care costs');

INSERT INTO justifications (target_type, target_id, basis_type, basis_id, polarity) VALUES
('STATEMENT', 1, 'STATEMENT', 2, 'POSITIVE'),
('STATEMENT', 1, 'STATEMENT', 3, 'NEGATIVE'),
('STATEMENT', 1, 'STATEMENT', 4, 'POSITIVE'),
('STATEMENT', 1, 'STATEMENT', 5, 'POSITIVE'),
('STATEMENT', 1, 'STATEMENT', 6, 'NEGATIVE'),
('STATEMENT', 1, 'REFERENCE', 1, 'NEGATIVE');

INSERT INTO citations (text) VALUES
('Tax Credits under the Affordable Care Act vs. the American Health Care Act: An Interactive Map');

INSERT INTO "references" (citation_id, quote) VALUES
(1, 'Generally, people who are older, lower-income, or live in high-premium areas (like Alaska and Arizona) receive larger tax credits under the ACA than they would under the American Health Care Act replacement.');

INSERT INTO urls (url) VALUES
('http://kff.org/interactive/tax-credits-under-the-affordable-care-act-vs-replacement-proposal-interactive-map/');

INSERT INTO reference_urls (reference_id, url_id) VALUES
(1, 1);