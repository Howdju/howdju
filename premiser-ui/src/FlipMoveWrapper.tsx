import React, { Component, ReactNode } from "react";

interface Props {
  /** A unique key for each child of FlipMove. */
  key: string;
  /** The children to wrap. */
  children: ReactNode;
}

/**
 * A class-based component to wrap functional component children of FlipMove.
 *
 * TODO(221) revisit whether we need this if we replace/upgrade react-flip-move.
 *
 * Prevents this error:
 *
 * ```
 * >> Error, via react-flip-move <<
 *
 * You provided a stateless functional component as a child to <FlipMove>. Unfortunately, SFCs aren't supported, because Flip Move needs access to the backing instances via refs, and SFCs don't have a public instance that holds that info.
 *
 * Please wrap your components in a native element (eg. <div>), or a non-functional component.
 * ```
 */
export default class FlipMoveWrapper extends Component<Props> {
  render() {
    const { key, children } = this.props;
    return <div key={key}>{children}</div>;
  }
}
