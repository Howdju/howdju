import React from "react";
import PropTypes from "prop-types";
import { CircularProgress } from "react-md";
import { Link } from "react-router-dom";
import cn from "classnames";
import get from "lodash/get";
import moment from "moment";

import { JustificationRootTargetTypes } from "howdju-common";

import config from "./config";
import JustificationCountViewer from "./JustificationCountViewer";
import paths from "./paths";
import { combineIds, describeRootTarget } from "./viewModels";

export default class StatementViewer extends React.Component {
  static propTypes = {
    statement: PropTypes.object,
  };

  static defaultProps = {
    showStatusText: true,
    showJustificationCount: true,
  };

  render() {
    const {
      id,
      statement,
      className,
      showStatusText,
      contextTrailItems,
      showJustificationCount,
      editorId: _editorId,
      suggestionsKey: _suggestionsKey,
      ...rest
    } = this.props;

    if (!statement) {
      return <CircularProgress id={combineIds(id, "progress")} />;
    }

    const age = statement.created ? moment(statement.created).fromNow() : "";
    const created = statement.created
      ? moment(statement.created).format(config.humanDateTimeFormat)
      : "";
    const creatorName = get(statement, "creator.longName");
    const creatorNameDescription = (creatorName && ` by ${creatorName}`) || "";

    return (
      <div {...rest} id={id} className={cn(className, "statement-viewer")}>
        {statement && (
          <div className="statement-viewer">
            <div className="statement-text">
              <Link to={paths.statement(statement, contextTrailItems)}>
                {describeRootTarget(
                  JustificationRootTargetTypes.STATEMENT,
                  statement
                )}{" "}
                {showJustificationCount &&
                  statement.rootJustificationCountByPolarity && (
                    <JustificationCountViewer
                      justificationCountByPolarity={
                        statement.rootJustificationCountByPolarity
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
