import React from "react";
import {
  Switch as ReactMdSwitch,
  SwitchProps as ReactMdSwitchProps,
} from "@react-md/form";

import { OnPropertyChangeCallback } from "@/types";
import { toToggleOnChangeCallback } from "@/util";

export interface SwitchProps extends Omit<ReactMdSwitchProps, "onChange"> {
  onPropertyChange: OnPropertyChangeCallback;
}

export function Switch({ onPropertyChange, ...rest }: SwitchProps) {
  return (
    <ReactMdSwitch
      onChange={toToggleOnChangeCallback(onPropertyChange)}
      {...rest}
    />
  );
}
