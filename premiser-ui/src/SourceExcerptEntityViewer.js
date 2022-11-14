import React, { Component } from "react";
import PropTypes from "prop-types";
import upperFirst from "lodash/upperFirst";

import { sourceExcerptDescription, sourceExcerptIconName } from "./viewModels";
import EntityViewer from "./EntityViewer";
import SourceExcerptViewer from "./SourceExcerptViewer";

export default class SourceExcerptEntityViewer extends Component {
  render() {
    const {
      component,
      id,
      sourceExcerpt,
      editorId,
      suggestionsKey,
      menu,
      showStatusText,
      showUrls,
    } = this.props;
    return (
      <EntityViewer
        iconName={sourceExcerptIconName(sourceExcerpt)}
        iconTitle={upperFirst(sourceExcerptDescription(sourceExcerpt))}
        component={component}
        entity={
          <SourceExcerptViewer
            id={id}
            sourceExcerpt={sourceExcerpt}
            editorId={editorId}
            suggestionsKey={suggestionsKey}
            showStatusText={showStatusText}
            showUrls={showUrls}
          />
        }
        menu={menu}
      />
    );
  }
}
SourceExcerptEntityViewer.propTypes = {
  id: PropTypes.string.isRequired,
};
