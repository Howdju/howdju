import React, { Component } from "react";
import PropTypes from "prop-types";
import { toErrorMessage } from "./modelErrorMessages";
import map from "lodash/map";

class ErrorMessages extends Component {
  render() {
    const { errors } = this.props;

    const errorList = (
      <ul className="error-message">
        {errors &&
          map(errors, (error) => <li key={error}>{toErrorMessage(error)}</li>)}
      </ul>
    );
    return errors && errors.length > 0 ? errorList : null;
  }
}
ErrorMessages.propTypes = {
  errors: PropTypes.array,
};

export default ErrorMessages;
