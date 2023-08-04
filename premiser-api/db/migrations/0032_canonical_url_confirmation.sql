-- Some URLs won't declare a canonical URL.
alter table urls alter column canonical_url drop not null;

create table canonical_url_confirmations (
  -- The URL we checked for a canonical URL.
  url varchar(65536) not null,
  -- If null, the URL had no canonical URL.
  canonical_url varchar(65536),
  retrieved_at timestamp not null
);
create index canonical_url_confirmations_url_idx on canonical_url_confirmations(url);
create index canonical_url_confirmations_canonical_url_idx on canonical_url_confirmations(canonical_url);
