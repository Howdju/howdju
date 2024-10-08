import React, { MouseEvent, useState } from "react";
import { MaterialSymbol } from "react-material-symbols";
import { isEmpty } from "lodash";

import {
  CreateUrlLocatorInput,
  isUrl,
  makeCreateUrlLocatorInput,
  normalizeUrl,
} from "howdju-common";
import { api } from "howdju-client-common";

import { CircularProgress } from "@/components/progress/CircularProgress";
import { makeErrorPropCreator } from "@/modelErrorMessages";
import { EditorFieldsDispatch, EntityEditorFieldsProps } from "./withEditor";
import { EditorType } from "@/reducers/editors";
import { editors } from "@/actions";
import { useAppDispatch, useAppSelector } from "@/hooks";
import IconButton from "@/components/button/IconButton";
import { FontIcon } from "@react-md/icon";
import TextButton from "@/components/button/TextButton";
import UrlTextField from "@/components/text/UrlTextField";

import "./UrlLocatorsEditorFields.scss";

interface Props
  extends EntityEditorFieldsProps<"urlLocators", CreateUrlLocatorInput[]> {
  editorDispatch: EditorFieldsDispatch;
  /**
   * An optional callback for when the user clicks the infer MediaExcerpt into button.
   *
   * If missing, the button is not shown.
   */
  onInferMediaExcerptInfo?: (url: string, index: number) => void;
  /** The max number of UrlLocators to allow. */
  maxUrlLocatorCount?: number;
}

export default function UrlLocatorsEditorFields({
  id,
  name,
  disabled,
  onBlur,
  onPropertyChange,
  onSubmit,
  urlLocators,
  wasSubmitAttempted,
  errors,
  dirtyFields,
  blurredFields,
  editorDispatch,
  onInferMediaExcerptInfo,
  maxUrlLocatorCount = 1,
}: Props) {
  const [normalUrlsByName, setNormalUrlsByName] = useState(
    {} as Record<string, string>
  );
  const urlStatesByName = useAppSelector(
    (state) => state.urlLocatorsEditorFields.urlStatesByName
  );
  const dispatch = useAppDispatch();

  if (!urlLocators) {
    return null;
  }

  function onRemoveUrlLocator(index: number) {
    if (!name) {
      throw new Error(`Unable to remove URL locator without name: ${id}`);
    }
    editorDispatch((editorType: EditorType, editorId: string) =>
      editors.removeListItem(editorType, editorId, name, index)
    );
  }

  function onAddUrlLocator(_event: MouseEvent<HTMLElement>) {
    if (!name) {
      throw new Error(`Unable to add URL locator without name: ${id}`);
    }
    editorDispatch((editorType: EditorType, editorId: string) =>
      editors.addListItem(
        editorType,
        editorId,
        name,
        0,
        makeCreateUrlLocatorInput
      )
    );
  }

  function onBlurUrlLocatorUrl(event: React.FocusEvent<HTMLInputElement>) {
    if (onBlur) {
      onBlur(event);
    }
    const name = event.target.name;
    const value = event.target.value;
    if (!isUrl(value)) {
      return;
    }
    if (!(name in normalUrlsByName)) {
      const normalUrl = normalizeUrl(value);
      setNormalUrlsByName({
        ...normalUrlsByName,
        [name]: normalUrl,
      });
      dispatch(api.fetchCanonicalUrl(name, value));
    } else {
      const normalUrl = normalUrlsByName[name];
      const newNormalUrl = normalizeUrl(value);
      if (newNormalUrl !== normalUrl) {
        dispatch(api.fetchCanonicalUrl(name, value));
        setNormalUrlsByName({
          ...normalUrlsByName,
          [name]: newNormalUrl,
        });
      }
    }
  }

  const errorProps = makeErrorPropCreator(
    wasSubmitAttempted,
    errors,
    dirtyFields,
    blurredFields
  );
  return (
    <div>
      {urlLocators.map(({ url, anchors }, index) => {
        const normalizedUrl = isUrl(url.url)
          ? normalizeUrl(url.url)
          : undefined;
        const urlName = `${name}[${index}].url.url`;
        const { isFetchingCanonicalUrl, canonicalUrl } =
          urlStatesByName[urlName] || {};
        return (
          <div key={`${id}[${index}]`}>
            <UrlTextField
              id={`${id}[${index}].url.url`}
              name={urlName}
              aria-label="url"
              label="URL"
              value={url.url}
              rightButtons={
                <>
                  {onInferMediaExcerptInfo && (
                    <IconButton
                      key="infer-media-excerpt-info-button"
                      onClick={() => onInferMediaExcerptInfo(url.url, index)}
                      disabled={disabled || !url.url}
                    >
                      <MaterialSymbol
                        icon="plagiarism"
                        size={22}
                        title="Infer quotation and source description"
                      />
                    </IconButton>
                  )}
                  <IconButton
                    key="delete-url-locator-button"
                    onClick={() => onRemoveUrlLocator(index)}
                    disabled={disabled}
                  >
                    <FontIcon>delete</FontIcon>
                  </IconButton>
                </>
              }
              disabled={disabled || !isEmpty(anchors)}
              onBlur={onBlurUrlLocatorUrl}
              onPropertyChange={onPropertyChange}
              onSubmit={onSubmit}
              messageProps={errorProps((ul) => ul[index].url.url)}
            />
            {normalizedUrl && normalizedUrl !== url.url && (
              <div className="url-status">
                Normalized to{" "}
                <span className="url-status-url">{normalizedUrl}</span>
              </div>
            )}
            {canonicalUrl && ![url.url, normalizedUrl].includes(canonicalUrl) && (
              <div className="url-status">
                Canonical URL:{" "}
                <span className="url-status-url">{canonicalUrl}</span>
              </div>
            )}
            {isFetchingCanonicalUrl && (
              <CircularProgress id="fetching-canonical-url" />
            )}
          </div>
        );
      })}
      {(urlLocators?.length ?? 0) < maxUrlLocatorCount && (
        <TextButton
          icon={<MaterialSymbol icon="add_link" />}
          onClick={onAddUrlLocator}
          title="Add URL locator"
          disabled={disabled}
        >
          Add URL locator
        </TextButton>
      )}
    </div>
  );
}
