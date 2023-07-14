-- Make it efficient to find URLs by canonical URL.
create index urls_canonical_url_idx on urls (canonical_url);
