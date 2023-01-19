import cn from "classnames";
import includes from "lodash/includes";
import map from "lodash/map";
import React from "react";
import { Chip, Avatar, FontIcon, ChipProps } from "react-md";

import { Keys } from "./keyCodes";

import "./ChipsList.scss";
import {
  ListClickCallback,
  ListEventCallback,
  ListKeyDownCallback,
} from "./types";

const deleteKeys = [Keys.BACKSPACE, Keys.DELETE];

export interface Chip {
  label: string;
  className?: string;
}

interface Props {
  chips: Chip[];
  // Whether to show an icon for removing the chip.
  removable: boolean;
  // Called when a user clicks a chip.  Not called if the the user clicked the remove icon.
  onClickChip: ListClickCallback<string>;
  onClickAvatar?: ListClickCallback<string>;
  // called when a users removes a chip, either by pressing a delete key with it focused or by clicking the remove icon
  onRemoveChip?: ListEventCallback<string>;
  // components that will be inserted as siblings after the chips
  extraChildren: JSX.Element[];
  showAvatars: boolean;
  className?: string;
  removeIconName: string;
}

/** A list of chips supporting clicking on two icons on either side. */
export default function ChipsList(props: Props) {
  const onClickChip: ListClickCallback<Chip> = (chip, index, event) => {
    if (props.onClickChip) {
      props.onClickChip(chip.label, index, event);
    }
  };

  const onKeyDownChip: ListKeyDownCallback<Chip> = (chip, index, event) => {
    if (onRemoveChip && includes(deleteKeys, event.key)) {
      // In some browsers the delete key goes back in history, so prevent that
      event.preventDefault();
      onRemoveChip(chip.label, index, event);
    }
  };

  const onClickAvatar: ListClickCallback<Chip> = (chip, index, event) => {
    event.stopPropagation();
    if (props.onClickAvatar) {
      props.onClickAvatar(chip.label, index, event);
    } else if (props.onClickChip) {
      props.onClickChip(chip.label, index, event);
    }
  };

  const onClickRemove: ListClickCallback<Chip> = (chip, index, event) => {
    // Currently has no effect because of react-md treating Chips as buttons, but it's what we are trying to do...
    event.stopPropagation();

    if (props.onRemoveChip) {
      props.onRemoveChip(chip.label, index, event);
    } else if (props.onClickChip) {
      props.onClickChip(chip.label, index, event);
    }
  };

  const {
    chips,
    extraChildren,
    showAvatars = false,
    removable = false,
    className,
    removeIconName = "clear",
    // ignore
    onRemoveChip,
    ...rest
  } = props;

  return (
    <div {...rest} className={cn(className, "chips-list")}>
      {map(chips, (chip, index) => {
        const chipProps: ChipProps = {
          label: chip.label,
          removable: removable,
          className: chip.className,
          children: removable && (
            <FontIcon
              className="remove-chip-icon chip-icon"
              onClick={(event) => onClickRemove(chip, index, event)}
            >
              {removeIconName}
            </FontIcon>
          ),
          rotateIcon: false,
          onClick: (event) => onClickChip(chip, index, event),
          onKeyDown: (event) => onKeyDownChip(chip, index, event),
        };

        // react-md limitation: can't pass along a falsy avatar
        if (showAvatars) {
          chipProps.avatar = (
            <Avatar
              icon={<FontIcon className="chip-icon">thumb_up</FontIcon>}
              onClick={(event) => onClickAvatar(chip, index, event)}
            />
          );
        }
        return <Chip key={chip.label} {...chipProps} />;
      })}

      {extraChildren}
    </div>
  );
}
