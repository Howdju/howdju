import classNames from "classnames";
import React from "react";
import { Button } from "react-md";
import type { ButtonProps } from "react-md/lib/Buttons";

interface Props extends ButtonProps {
  appearDisabled?: boolean;
}

/**
 * A submit button that emulates being disabled so that it can show a title.
 *
 * Button's with disabled=true will not show their title attribute as a tooltip upon hover. But
 * showing the title attribute when the user hovers over a disabled button is a very useful way to
 * tell the user what to do to fix the form. Also, disabled buttons cannot generate clicks, but
 * allowing the user to click on a disabled button allows us to progressively show greater error
 * details in the form (`wasSubmitAttempted`)
 */
export default function SubmitButton({
  appearDisabled = false,
  ...rest
}: Props) {
  return (
    <Button
      {...rest}
      raised={!appearDisabled}
      flat={appearDisabled}
      primary={!appearDisabled}
      type="submit"
      className={classNames({
        "md-btn--raised-disabled": appearDisabled,
        "md-text--disabled": appearDisabled,
      })}
    />
  );
}
