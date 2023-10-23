import React, { ChangeEvent } from "react";
import { Radio, RadioProps } from "@react-md/form";

import { FormMessage, FormMessageProps } from "@/components/form/FormMessage";
import { combineIds } from "@/viewModels";
import { OnPropertyChangeCallback } from "@/types";

interface RadioInfo extends Pick<RadioProps, "label"> {
  value: string;
}

interface RadioGroupProps
  extends Pick<RadioProps, "id" | "name" | "inline" | "disabled"> {
  /** The radios the group contains */
  radios: RadioInfo[];
  /** The current value, if any. */
  value?: string;
  onPropertyChange: OnPropertyChangeCallback;
  messageProps?: FormMessageProps;
}

export function RadioGroup({
  id,
  name,
  value,
  inline,
  disabled,
  radios,
  onPropertyChange,
  messageProps,
  ...rest
}: RadioGroupProps) {
  function onChange(event: ChangeEvent<HTMLInputElement>) {
    onPropertyChange({ [event.target.name]: event.target.value });
  }
  return (
    <div className="radio-group" {...rest}>
      {radios.map((radio) => (
        <Radio
          id={combineIds(id, `${radio.value}`)}
          name={name}
          inline={inline}
          key={radio.value}
          checked={radio.value === value}
          disabled={disabled}
          onChange={onChange}
          error={!!messageProps?.errorMessage}
          {...radio}
        />
      ))}
      {messageProps && (
        <FormMessage id={combineIds(`${id}`, "message")} {...messageProps} />
      )}
    </div>
  );
}
