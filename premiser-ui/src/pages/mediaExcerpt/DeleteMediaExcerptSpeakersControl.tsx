import React from "react";

import { MediaExcerptSpeakerOut, MediaExcerptView } from "howdju-common";
import { api } from "howdju-client-common";

import { useAppDispatch } from "@/hooks";
import MediaExcerptSpeakerViewer from "@/components/mediaExcerpts/MediaExcerptSpeakerViewer";

import "./DeleteMediaExcerptSpeakersControl.scss";
import OutlineButton from "@/components/button/OutlineButton";

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
          <OutlineButton onClick={() => deleteSpeaker(speaker)}>
            Delete
          </OutlineButton>
        </li>
      ))}
    </ul>
  );
}
