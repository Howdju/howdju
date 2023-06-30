create unique index source_normal_description_unique_idx
  on sources (normal_description) where deleted is null;
