import React from "react";
import { useDispatch, useSelector } from "react-redux";
import queryString, { ParsedQuery } from "query-string";
import { useLocation } from "react-router";

import { CreateMediaExcerptInput } from "howdju-common";

import { editors } from "@/actions";
import { RootState } from "@/setupStore";
import { isArray } from "lodash";
import HowdjuHelmet from "@/Helmet";
import ErrorMessages from "@/ErrorMessages";
import MediaExcerptEditor from "@/editors/MediaExcerptEditor";
import SingleColumnGrid from "@/components/layout/SingleColumnGrid";

const id = "submit-media-excerpt";
export const editorType = "MEDIA_EXCERPT";
export const editorId = id;

/**
 * Page for submitting a MediaExcerpt.
 */
export default function SubmitMediaExcerptPage() {
  const dispatch = useDispatch();

  const location = useLocation();
  const queryParams = queryString.parse(location.search);
  let editEntity = useSelector(
    (state: RootState) => state.editors[editorType]?.[editorId]?.editEntity
  ) as CreateMediaExcerptInput | undefined;

  const errors = [];

  if (!editEntity) {
    const { model: inferredEditEntity, errors: inferrenceErrors } =
      inferMediaExcerptFromQueryParams(queryParams);
    editEntity = inferredEditEntity;
    errors.push(...inferrenceErrors);

    dispatch(editors.beginEdit(editorType, editorId, editEntity));
  }

  return (
    <div>
      <HowdjuHelmet>
        <title>Submit Media Excerpt — Howdju</title>
      </HowdjuHelmet>
      <h1>Create Media Excerpt</h1>
      <ErrorMessages errors={errors} />
      <SingleColumnGrid>
        <MediaExcerptEditor
          id={id}
          editorId={editorId}
          commitBehavior={"CommitThenView"}
          submitButtonText="Create"
        />
      </SingleColumnGrid>
    </div>
  );
}

function inferMediaExcerptFromQueryParams(queryParams: ParsedQuery<string>) {
  let { quotation, description } = queryParams;
  const { url } = queryParams;

  const errors = [];

  if (isArray(quotation)) {
    errors.push("Can only submit one quote. Extras discarded.");
    // If multiple query parameters are defined, the array must have at least two elements.
    quotation = quotation[0];
  }
  if (isArray(description)) {
    errors.push("Can only submit one description. Extras discarded.");
    // If multiple query parameters are defined, the array must have at least two elements.
    description = description[0];
  }

  quotation = quotation || "";
  description = description || "";
  const urls = !url ? [""] : !isArray(url) ? [url] : url;

  const model: CreateMediaExcerptInput = {
    localRep: {
      quotation,
    },
    locators: {
      urlLocators: urls.map((url) => ({
        url: {
          url,
        },
      })),
    },
    citations: [{ source: { description } }],
    speakers: [],
  };
  return { model, errors };
}
