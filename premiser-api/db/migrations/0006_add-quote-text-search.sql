CREATE INDEX writ_quotes_quote_text_english_idx ON writ_quotes USING GIN (to_tsvector('english', quote_text));