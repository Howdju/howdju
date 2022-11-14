import React from "react";
import PropTypes from "prop-types";
import cn from "classnames";
import { FontIcon, injectTooltip } from "react-md";

// Material icons shouldn't have any other children other than the child string and
// it gets converted into a span if the tooltip is added, so we add a container
// around the two.
const TooltipFontIcon = injectTooltip(
  ({ children, iconClassName, className, tooltip, ...props }) => (
    <div {...props} className={cn(className, "inline-rel-container")}>
      {tooltip}
      <FontIcon iconClassName={iconClassName}>{children}</FontIcon>
    </div>
  )
);

TooltipFontIcon.propTypes = {
  children: PropTypes.string.isRequired,
  className: PropTypes.string,
  iconClassName: PropTypes.string,
  tooltip: PropTypes.node,
};

export default TooltipFontIcon;
