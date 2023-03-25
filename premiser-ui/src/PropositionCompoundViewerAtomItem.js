import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import get from "lodash/get";
import cn from "classnames";

import {
  editors,
  goto,
  ui,
  mapActionCreatorGroupToDispatchToProps,
} from "./actions";
import { combineIds, combineSuggestionsKeys } from "./viewModels";
import { EditorTypes } from "./reducers/editors";
import PropositionEntityViewer from "./PropositionEntityViewer";
import JustificationsTree from "./JustificationsTree";

import "./PropositionCompoundViewerAtomItem.scss";

class PropositionCompoundViewerAtomItem extends Component {
  constructor() {
    super();

    this.editorType = EditorTypes.PROPOSITION;
  }

  render() {
    const {
      id,
      atom,
      doShowControls,
      doShowJustifications,
      isCondensed,
      isUnCondensed,
      isHighlighted,
      showBasisUrls,
      showStatusText,
      contextTrailItems,
      showJustificationCount,
    } = this.props;

    const hasJustifications =
      atom.entity.justifications && atom.entity.justifications.length > 0;
    const justifications = atom.entity.justifications;

    return (
      <li
        id={id}
        className={cn("compound-atom proposition-atom", {
          highlighted: isHighlighted,
        })}
      >
        <PropositionEntityViewer
          id={combineIds(id, "proposition")}
          proposition={atom.entity}
          editorId={propositionEditorId(this.props)}
          suggestionsKey={combineSuggestionsKeys(id, "proposition")}
          doShowControls={doShowControls}
          showStatusText={showStatusText}
          contextTrailItems={contextTrailItems}
          showJustificationCount={showJustificationCount}
        />
        {doShowJustifications && hasJustifications && (
          <JustificationsTree
            id={combineIds(id, "justificationsTree")}
            justifications={justifications}
            doShowControls={doShowControls}
            doShowJustifications={doShowJustifications}
            isCondensed={isCondensed}
            isUnCondensed={isUnCondensed}
            showBasisUrls={showBasisUrls}
            contextTrailItems={contextTrailItems}
          />
        )}
      </li>
    );
  }
}
PropositionCompoundViewerAtomItem.propTypes = {
  /** Used to identify the context menu */
  id: PropTypes.string.isRequired,
  atom: PropTypes.object.isRequired,
  doShowJustifications: PropTypes.bool,
  doShowControls: PropTypes.bool,
  showStatusText: PropTypes.bool,
  isHighlighted: PropTypes.bool,
  isCondensed: PropTypes.bool,
  isUnCondensed: PropTypes.bool,
  showBasisUrls: PropTypes.bool,
  contextTrailItems: PropTypes.array,
  showJustificationCount: PropTypes.bool,
};
PropositionCompoundViewerAtomItem.defaultProps = {
  doShowControls: true,
};

function propositionEditorId(props) {
  return combineIds(props.id, "proposition");
}

const mapStateToProps = (state, ownProps) => {
  const { editEntity } = get(
    state,
    ["editors", EditorTypes.PROPOSITION, propositionEditorId(ownProps)],
    {}
  );
  const isEditing = !!editEntity;
  return {
    isEditing,
  };
};

export default connect(
  mapStateToProps,
  mapActionCreatorGroupToDispatchToProps({
    editors,
    goto,
    ui,
  })
)(PropositionCompoundViewerAtomItem);
