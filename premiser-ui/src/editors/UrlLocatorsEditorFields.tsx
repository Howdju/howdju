import React, { MouseEvent } from "react";
import { MaterialSymbol } from "react-material-symbols";
import { Button } from "react-md";
import { isEmpty } from "lodash";

import {
  CreateUrlLocatorInput,
  makeCreateUrlLocatorInput,
} from "howdju-common";

import { makeErrorPropCreator } from "@/modelErrorMessages";
import SingleLineTextField from "@/SingleLineTextField";
import { EditorFieldsDispatch, EntityEditorFieldsProps } from "./withEditor";
import { combineIds, combineNames } from "@/viewModels";
import { EditorType } from "@/reducers/editors";
import { editors } from "@/actions";

interface Props
  extends EntityEditorFieldsProps<"urlLocators", CreateUrlLocatorInput[]> {
  editorDispatch: EditorFieldsDispatch;
  /**
   * An optional callback for when the user clicks the infer MediaExcerpt into button.
   *
   * If missing, the button is not shown.
   */
  onInferMediaExcerptInfo?: (url: string) => void;
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

  const errorProps = makeErrorPropCreator(
    wasSubmitAttempted,
    errors,
    dirtyFields,
    blurredFields
  );
  return (
    <div>
      {urlLocators.map(({ url, anchors }, index) => (
        <SingleLineTextField
          {...errorProps((ul) => ul[index].url.url)}
          id={combineIds(id, `[${index}]url.url`)}
          key={combineIds(id, `[${index}]url.url`)}
          name={combineNames(name, `[${index}]url.url`)}
          aria-label="url"
          type="url"
          label="URL"
          value={url.url}
          rightIcon={
            <>
              {!isEmpty(anchors) && (
                <MaterialSymbol
                  key="anchor-icon"
                  className="url-anchor-icon"
                  icon="my_location"
                  size={16}
                  title="Has a fragment taking you directly to the excerpt"
                />
              )}
              {onInferMediaExcerptInfo && (
                <Button
                  key="infer-media-excerpt-info-button"
                  icon
                  onClick={() => onInferMediaExcerptInfo(url.url)}
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
          onBlur={onBlur}
          onPropertyChange={onPropertyChange}
          onSubmit={onSubmit}
        />
      ))}
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
