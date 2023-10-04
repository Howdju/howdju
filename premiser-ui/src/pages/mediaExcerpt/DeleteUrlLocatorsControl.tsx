import React from "react";

import { MediaExcerptOut, UrlLocatorOut } from "howdju-common";

import { useAppDispatch } from "@/hooks";
import { api } from "@/apiActions";
import OutlineButton from "@/components/button/OutlineButton";

import "./DeleteUrlLocatorsControl.scss";

interface Props {
  mediaExcerpt: MediaExcerptOut;
}

export default function DeleteUrlLocatorsControl({ mediaExcerpt }: Props) {
  const dispatch = useAppDispatch();

  function deleteUrlLocator(urlLocator: UrlLocatorOut) {
    dispatch(api.deleteUrlLocator(urlLocator));
  }

  return (
    <ul className="delete-url-locators-control">
      {mediaExcerpt.locators.urlLocators.map((urlLocator, index) => (
        <li key={index}>
          {urlLocator.url.url}
          <OutlineButton onClick={() => deleteUrlLocator(urlLocator)}>
            Delete
          </OutlineButton>
        </li>
      ))}
    </ul>
  );
}
