ALTER TABLE writ_quote_url_target_anchors
    DROP CONSTRAINT writ_quote_url_target_anchors_writ_quote_url_target_id_fkey;

ALTER TABLE writ_quote_url_target_anchors
    ADD CONSTRAINT writ_quote_url_target_anchors_writ_quote_url_target_id_fkey
        FOREIGN KEY (writ_quote_url_target_id) REFERENCES writ_quote_url_targets(writ_quote_url_target_id);
