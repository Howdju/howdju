alter table users add column if not exists affirmed_majority_consent timestamp;
alter table users add column if not exists affirmed_13_years_or_older timestamp;
alter table users add column if not exists affirmed_not_gdpr timestamp;
