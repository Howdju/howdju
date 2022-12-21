drop index unq_registration_requests_email;
create index idx_registration_requests_email on registration_requests (email);
