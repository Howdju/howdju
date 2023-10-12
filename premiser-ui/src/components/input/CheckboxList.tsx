import React from "react";
import map from "lodash/map";
import forEach from "lodash/forEach";
import cn from "classnames";

import { Checkbox } from "./Checkbox";
import { combineIds } from "@/viewModels";
import {
  ComponentId,
  ComponentName,
  OnPropertyChangeCallback,
  PropertyChanges,
} from "@/types";

import "./CheckboxList.scss";

interface CheckboxListProps {
  id: ComponentId;
  name: ComponentName;
  value: string[] | undefined;
  descriptionsByCode: Record<string, string>;
  disabled?: boolean;
  error?: boolean;
  errorText?: string;
  onPropertyChange: OnPropertyChangeCallback;
}

/** Renders checkboxes and returns values as an array of selected items. */
// TODO(#17) why not a multi-Select?
export default function CheckboxList({
  id,
  name,
  value,
  descriptionsByCode,
  disabled,
  error,
  errorText,
  onPropertyChange,
}: CheckboxListProps) {
  const _onPropertyChange = (properties: PropertyChanges) => {
    const newSet = new Set(value);
    forEach(properties, (isSelected, key) => {
      if (isSelected) {
        newSet.add(key);
      } else {
        newSet.delete(key);
      }
    });
    if (onPropertyChange) {
      onPropertyChange({
        [name]: Array.from(newSet),
      });
    }
  };

  return (
    <fieldset className={cn({ error })}>
      {error && <p className="error-message">{errorText}</p>}
      {map(descriptionsByCode, (description, code) => {
        const checked = value ? value.indexOf(code) >= 0 : false;
        return (
          <Checkbox
            id={combineIds(id, `${code}-checkbox`)}
            key={code}
            name={code}
            label={description}
            value={code}
            checked={checked}
            disabled={disabled}
            onPropertyChange={_onPropertyChange}
          />
        );
      })}
    </fieldset>
  );
}
