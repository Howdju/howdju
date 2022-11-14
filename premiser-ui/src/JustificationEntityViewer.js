import React, { Component } from "react";
import PropTypes from "prop-types";
import { Button } from "react-md";
import moment from "moment";

import { isCounter, isRootJustification } from "howdju-common";

import EntityViewer from "./EntityViewer";
import JustificationRootTargetViewer from "./JustificationRootTargetViewer";
import JustificationChatBubble from "./JustificationChatBubble";
import config from "./config";
import { combineIds, combineSuggestionsKeys } from "./viewModels";

export default class JustificationEntityViewer extends Component {
  render() {
    const {
      component,
      id,
      justification,
      suggestionsKey,
      doShowBasisJustifications,
      doShowControls,
      onExpandJustifications,
      showBasisUrls,
      doShowRootTarget,
      doShowCounterTarget,
      onClickWritQuoteUrl,
      showStatusText,
    } = this.props;

    const _isCounter = isCounter(justification);
    const _doesCounterRootJustification =
      _isCounter && isRootJustification(justification.target.entity);

    const age = justification.created
      ? moment(justification.created).fromNow()
      : "";
    const created = justification.created
      ? moment(justification.created).format(config.humanDateTimeFormat)
      : "";

    const expander = (
      <div className="justification-expander-wrapper">
        <Button icon onClick={onExpandJustifications}>
          more_horiz
        </Button>
      </div>
    );

    return (
      <EntityViewer
        component={component}
        iconName="merge_type"
        iconTitle="Justification"
        entity={
          <div>
            {doShowRootTarget && (
              <JustificationRootTargetViewer
                id={combineIds(id, "root-target")}
                rootTargetType={justification.rootTargetType}
                rootTarget={justification.rootTarget}
                suggestionsKey={combineSuggestionsKeys(
                  suggestionsKey,
                  "rootTarget"
                )}
                showStatusText={showStatusText}
              />
            )}

            <div className="entity-status-text">
              created <span title={created}>{age}</span>
            </div>

            {_isCounter && !_doesCounterRootJustification && expander}

            {_isCounter && doShowCounterTarget && (
              <JustificationChatBubble
                id={`target-justification-${justification.target.entity.id}`}
                justification={justification.target.entity}
                doShowBasisJustifications={doShowBasisJustifications}
                doShowControls={doShowControls}
                showBasisUrls={showBasisUrls}
                onClickWritQuoteUrl={onClickWritQuoteUrl}
                showStatusText={showStatusText}
              />
            )}
            <JustificationChatBubble
              justification={justification}
              doShowBasisJustifications={doShowBasisJustifications}
              doShowControls={doShowControls}
              showBasisUrls={showBasisUrls}
              onClickWritQuoteUrl={onClickWritQuoteUrl}
              showStatusText={showStatusText}
            />
          </div>
        }
      />
    );
  }
}
JustificationEntityViewer.propTypes = {
  id: PropTypes.string.isRequired,
  paraphrasingPropositionEditorId: PropTypes.string,
  sourceExcerptEditorId: PropTypes.string,
};
