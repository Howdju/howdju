create type auto_confirmation_status as enum ('FOUND', 'NOT_FOUND', 'ERROR');

-- Auto-confirmation results record the outcome of algorithmically looking for a locator's MediaExcerpt's
-- localReps using the locator.
create table url_locator_auto_confirmation_results (
  url_locator_auto_confirmation_result_id bigserial primary key,
  url_locator_id bigint references url_locators(url_locator_id),
  -- The URL that was confirmed
  url text not null,
  -- The quotation that was confirmed
  quotation text not null,
  complete_at timestamp not null,
  status auto_confirmation_status not null,
  -- If the result is 'found', this field will contain the quotation that was found.
  -- Since our matching algorithm may be fuzzy, we want to record what was actually found.
  found_quotation text,
  -- If the result is 'error', this field will contain the error message.
  error_message text
);

-- Index for readConfirmationStatusForUrlLocatorId
create index url_locator_auto_confirmation_results_status_complete_idx
  on url_locator_auto_confirmation_results(url_locator_id, status, complete_at desc);
