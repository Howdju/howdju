import React, { Component, ErrorInfo, ReactNode } from "react";
import { v4 as uuidv4 } from "uuid";

import { logger } from "./logger";

type Props = { children: ReactNode };
type State = {
  errorCorrelationId: string | undefined;
};

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      errorCorrelationId: undefined,
    };
  }

  static getDerivedStateFromError() {
    return {
      errorCorrelationId: uuidv4(),
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const errorMessage = error.toString();
    const { componentStack } = info;
    logger.error(errorMessage, componentStack, {
      error,
      info,
      errorCorrelationId: this.state.errorCorrelationId,
    });
  }

  render() {
    if (this.state.errorCorrelationId) {
      return (
        <div id="error-boundary">
          <h2>Something went wrong.</h2>
          <p>
            Please let us know what happened. Please reference Error ID{" "}
            {this.state.errorCorrelationId} when you contact us.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
