import React from "react";
import { Button } from "react-md";

import { MediaExcerptOut, UrlLocatorOut } from "howdju-common";

import { useAppDispatch } from "@/hooks";
import { api } from "@/apiActions";

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
          <Button raised onClick={() => deleteUrlLocator(urlLocator)}>
            Delete
          </Button>
        </li>
      ))}
    </ul>
  );
}
