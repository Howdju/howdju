import React, { Component } from "react";
import { MenuButton } from "react-md";

/** A MenuButton that stops click propagation so that clicks don't hide it. */
class TransientMenuButton extends Component {
  onMenuClick = (...args) => {
    const event = args[0];
    event.stopPropagation();
    if (this.props.onClick) {
      this.props.onClick.apply(this, args);
    }
  };

  render() {
    const { ...rest } = this.props;
    return <MenuButton {...rest} floating onClick={this.onMenuClick} />;
  }
}

export default TransientMenuButton;
