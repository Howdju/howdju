import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import cn from "classnames";
import moment from "moment";

import paths from "./paths";
import config from "./config";

export default function WritViewer(props) {
  const { id, writ, className, ...rest } = props;

  const age = writ.created ? moment(writ.created).fromNow() : "";
  const created = writ.created
    ? moment(writ.created).format(config.humanDateTimeFormat)
    : "";

  return (
    <div {...rest} id={id} className={cn(className, "writ-viewer")}>
      {writ && (
        <div>
          <div className="writ-text">
            <Link to={paths.searchJustifications({ writId: writ.id })}>
              {writ.title}
            </Link>
          </div>
          <div className="entity-status-text">
            created <span title={created}>{age}</span>
          </div>
        </div>
      )}
    </div>
  );
}
WritViewer.propTypes = {
  writ: PropTypes.object,
};
