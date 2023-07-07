create unique index persorg_person_unique_idx
  -- People might have the same name, and must be distinguished by known for.
  on persorgs (normal_name, normal_known_for)
    where deleted is null and is_organization = false;
create unique index persorg_organization_unique_idx
  -- Organizations should have a unique name.
  on persorgs (normal_name)
    where deleted is null and is_organization = true;
