CREATE INDEX statements_idx ON statements USING GIN (to_tsvector('english', text));
CREATE INDEX citations_idx ON citations USING GIN (to_tsvector('english', text));