
CREATE INDEX media_excerpt_quotation_english_idx ON media_excerpts
  USING GIN (to_tsvector('english', quotation));
