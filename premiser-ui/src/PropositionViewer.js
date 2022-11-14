import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import cn from "classnames";
import moment from "moment";
import get from "lodash/get";

import paths from "./paths";
import config from "./config";
import JustificationCountViewer from "./JustificationCountViewer";

export default class PropositionViewer extends React.Component {
  render() {
    const {
      id,
      proposition,
      className,
      showStatusText,
      contextTrailItems,
      showJustificationCount,
      ...rest
    } = this.props;

    const age = proposition.created
      ? moment(proposition.created).fromNow()
      : "";
    const created = proposition.created
      ? moment(proposition.created).format(config.humanDateTimeFormat)
      : "";
    const creatorName = get(proposition, "creator.longName");
    const creatorNameDescription = (creatorName && ` by ${creatorName}`) || "";

    return (
      <div {...rest} id={id} className={cn(className, "proposition-viewer")}>
        {proposition && (
          <div className="proposition-viewer">
            <div className="proposition-text">
              <Link to={paths.proposition(proposition, contextTrailItems)}>
                {proposition.text}{" "}
                {showJustificationCount &&
                  proposition.rootJustificationCountByPolarity && (
                    <JustificationCountViewer
                      justificationCountByPolarity={
                        proposition.rootJustificationCountByPolarity
                      }
                    />
                  )}
              </Link>
            </div>
            {showStatusText && (
              <div>
                <span className="entity-status-text">
                  created{creatorNameDescription}{" "}
                  <span title={created}>{age}</span>
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
}
PropositionViewer.propTypes = {
  proposition: PropTypes.object,
};
PropositionViewer.defaultprops = {
  showStatusText: true,
  showJustificationCount: true,
};
