import React from "react";
import { Button } from "react-md";

import { MediaExcerptSpeakerOut, MediaExcerptView } from "howdju-common";

import { useAppDispatch } from "@/hooks";
import { api } from "@/apiActions";
import MediaExcerptSpeakerViewer from "@/components/mediaExcerpts/MediaExcerptSpeakerViewer";

import "./DeleteMediaExcerptSpeakersControl.scss";

interface Props {
  mediaExcerpt: MediaExcerptView;
}

export default function DeleteMediaExcerptSpeakersControl({
  mediaExcerpt,
}: Props) {
  const dispatch = useAppDispatch();

  function deleteSpeaker(speaker: MediaExcerptSpeakerOut) {
    dispatch(api.deleteMediaExcerptSpeaker(speaker));
  }

  return (
    <ul className="delete-media-excerpt-speakers-control">
      {mediaExcerpt.speakers.map((speaker) => (
        <li key={speaker.key}>
          <MediaExcerptSpeakerViewer speaker={speaker} />
          <Button raised onClick={() => deleteSpeaker(speaker)}>
            Delete
          </Button>
        </li>
      ))}
    </ul>
  );
}
