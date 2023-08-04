import React, { MouseEvent, useState } from "react";
import { MaterialSymbol } from "react-material-symbols";
import { Button, CircularProgress } from "react-md";
import { isEmpty } from "lodash";

import {
  CreateUrlLocatorInput,
  makeCreateUrlLocatorInput,
  normalizeUrl,
} from "howdju-common";

import { makeErrorPropCreator } from "@/modelErrorMessages";
import SingleLineTextField from "@/SingleLineTextField";
import { EditorFieldsDispatch, EntityEditorFieldsProps } from "./withEditor";
import { combineIds, combineNames } from "@/viewModels";
import { EditorType } from "@/reducers/editors";
import { api, editors } from "@/actions";
import { isValidUrl } from "@/util";
import { useAppDispatch, useAppSelector } from "@/hooks";

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
      editors.removeListItem(editorType, editorId, index, name)
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
        0,
        name,
        makeCreateUrlLocatorInput
      )
    );
  }

  function onBlurUrlLocatorUrl(name: string, value: string) {
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
    if (onBlur) {
      onBlur(name, value);
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
        const normalizedUrl = isValidUrl(url.url)
          ? normalizeUrl(url.url)
          : undefined;
        const urlName = combineNames(name, `[${index}].url.url`);
        const { isFetchingCanonicalUrl, canonicalUrl } =
          urlStatesByName[urlName] || {};
        return (
          <div key={combineIds(id, `[${index}]`)}>
            <SingleLineTextField
              {...errorProps((ul) => ul[index].url.url)}
              id={combineIds(id, `[${index}].url.url`)}
              name={urlName}
              aria-label="url"
              type="url"
              label="URL"
              value={url.url}
              rightIcon={
                <>
                  {onInferMediaExcerptInfo && (
                    <Button
                      key="infer-media-excerpt-info-button"
                      icon
                      onClick={() => onInferMediaExcerptInfo(url.url, index)}
                      disabled={disabled || !url.url}
                    >
                      <MaterialSymbol
                        icon="plagiarism"
                        size={22}
                        title="Infer quotation and source description"
                      />
                    </Button>
                  )}
                  <Button
                    key="delete-url-locator-button"
                    icon
                    onClick={() => onRemoveUrlLocator(index)}
                    disabled={disabled}
                  >
                    delete
                  </Button>
                </>
              }
              rightIconStateful={false}
              disabled={disabled || !isEmpty(anchors)}
              onBlur={onBlurUrlLocatorUrl}
              onPropertyChange={onPropertyChange}
              onSubmit={onSubmit}
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
        <Button
          iconEl={<MaterialSymbol icon="add_link" />}
          raised
          onClick={onAddUrlLocator}
          title="Add URL locator"
          disabled={disabled}
        >
          Add URL locator
        </Button>
      )}
    </div>
  );
}
