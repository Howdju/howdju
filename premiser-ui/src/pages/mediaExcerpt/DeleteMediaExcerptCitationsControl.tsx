import React from "react";
import { Button } from "react-md";

import { MediaExcerptCitationOut, MediaExcerptOut } from "howdju-common";

import { useAppDispatch } from "@/hooks";
import { api } from "@/apiActions";
import MediaExcerptCitationViewer from "@/components/mediaExcerpts/MediaExcerptCitationViewer";

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
          <Button raised onClick={() => deleteCitation(citation)}>
            Delete
          </Button>
        </li>
      ))}
    </ul>
  );
}
