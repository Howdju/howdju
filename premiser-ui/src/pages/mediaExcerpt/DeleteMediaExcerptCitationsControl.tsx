import React from "react";

import { MediaExcerptCitationOut, MediaExcerptOut } from "howdju-common";
import { api } from "howdju-client-common";

import { useAppDispatch } from "@/hooks";
import MediaExcerptCitationViewer from "@/components/mediaExcerpts/MediaExcerptCitationViewer";
import OutlineButton from "@/components/button/OutlineButton";

import "./DeleteMediaExcerptCitationsControl.scss";

interface Props {
  mediaExcerpt: MediaExcerptOut;
}

export default function DeleteMediaExcerptCitationsControl({
  mediaExcerpt,
}: Props) {
  const dispatch = useAppDispatch();

  function deleteCitation(citation: MediaExcerptCitationOut) {
    dispatch(api.deleteMediaExcerptCitation(citation));
  }

  return (
    <ul className="delete-media-excerpt-citations-control">
      {mediaExcerpt.citations.map((citation, index) => (
        <li key={index}>
          <MediaExcerptCitationViewer citation={citation} />
          <OutlineButton onClick={() => deleteCitation(citation)}>
            Delete
          </OutlineButton>
        </li>
      ))}
    </ul>
  );
}
