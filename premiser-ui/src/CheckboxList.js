import React, { Component } from "react";
import map from "lodash/map";
import forEach from "lodash/forEach";
import cn from "classnames";

import Checkbox from "./Checkbox";
import { combineIds } from "./viewModels";

import "./CheckboxList.scss";

/** Renders checkboxes and returns values as an array of selected items. */
export default class CheckboxList extends Component {
  state = {
    selectedSet: new Set(),
  };

  onPropertyChange = (properties) => {
    const selectedSet = new Set(this.state.selectedSet);
    forEach(properties, (isSelected, key) => {
      if (isSelected) {
        selectedSet.add(key);
      } else {
        selectedSet.delete(key);
      }
    });
    if (this.props.onPropertyChange) {
      this.props.onPropertyChange({
        [this.props.name]: Array.from(selectedSet),
      });
    }
    this.setState({ selectedSet });
  };

  render() {
    const { id, descriptionsByCode, disabled, error, errorText } = this.props;
    const { selectedSet } = this.state;
    return (
      <fieldset className={cn({ error })}>
        {error && <p className="error-message">{errorText}</p>}
        {map(descriptionsByCode, (description, code) => (
          <Checkbox
            id={combineIds(id, `${code}-checkbox`)}
            key={code}
            name={code}
            label={description}
            value={code}
            checked={selectedSet.has(code)}
            disabled={disabled}
            onPropertyChange={this.onPropertyChange}
          />
        ))}
      </fieldset>
    );
  }
}
