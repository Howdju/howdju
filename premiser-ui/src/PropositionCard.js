import React, { Component } from "react";
import PropTypes from "prop-types";
import { Card, CardText } from "react-md";
import cn from "classnames";

import PropositionEntityViewer from "./PropositionEntityViewer";

// TODO(221) convert to functional component
export default class PropositionCard extends Component {
  render() {
    const {
      id,
      proposition,
      showStatusText,
      className,
      contextTrailItems,
      ...rest
    } = this.props;
    return (
      <Card {...rest} className={cn(className, "entity-card")}>
        <CardText>
          <PropositionEntityViewer
            id={id}
            proposition={proposition}
            contextTrailItems={contextTrailItems}
            showStatusText={showStatusText}
          />
        </CardText>
      </Card>
    );
  }
}
PropositionCard.propTypes = {
  id: PropTypes.string.isRequired,
  proposition: PropTypes.object.isRequired,
};
