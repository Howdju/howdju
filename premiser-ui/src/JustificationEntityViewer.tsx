import React, { ComponentType } from "react";
import { Button } from "react-md";
import { Props as ReactMdProps } from "react-md/lib";
import moment from "moment";

import {
  ContextTrailItem,
  isRootJustification,
  JustificationView,
} from "howdju-common";

import EntityViewer from "./EntityViewer";
import JustificationRootTargetViewer from "./JustificationRootTargetViewer";
import JustificationChatBubble from "./JustificationChatBubble";
import config from "./config";
import { combineIds, combineSuggestionsKeys, isCounter } from "./viewModels";
import {
  ComponentId,
  OnClickJustificationWritQuoteUrl,
  SuggestionsKey,
} from "./types";
import { RootTargetProps } from "./JustificationRootTargetViewer";

interface Props {
  id: ComponentId;
  justification: JustificationView;
  doShowControls: boolean;
  showBasisUrls: boolean;
  doShowRootTarget: boolean;
  doShowCounterTarget: boolean;
  contextTrailItems?: ContextTrailItem[];
  showStatusText: boolean;
  onClickWritQuoteUrl?: OnClickJustificationWritQuoteUrl;
  onExpandCounterAncestors?: ReactMdProps["onClick"];
  component?: ComponentType | string;
  suggestionsKey?: SuggestionsKey;
}

export default function JustificationEntityViewer({
  component,
  id,
  justification,
  suggestionsKey,
  doShowControls,
  onExpandCounterAncestors,
  showBasisUrls,
  doShowRootTarget,
  doShowCounterTarget,
  onClickWritQuoteUrl,
  showStatusText,
  contextTrailItems,
}: Props) {
  const _isCounter = isCounter(justification);
  const doesCounterRootJustification =
    _isCounter && isRootJustification(justification.target.entity);

  const age = justification.created
    ? moment(justification.created).fromNow()
    : "";
  const created = justification.created
    ? moment(justification.created).format(config.humanDateTimeFormat)
    : "";

  const expander = onExpandCounterAncestors && (
    <div className="justification-expander-wrapper">
      <Button icon onClick={onExpandCounterAncestors}>
        more_horiz
      </Button>
    </div>
  );

  const rootTargetProps = {
    rootTargetType: justification.rootTargetType,
    rootTarget: justification.rootTarget,
  } as RootTargetProps;

  return (
    <EntityViewer
      component={component}
      icon="merge_type"
      iconTitle="Justification"
      entity={
        <div>
          {doShowRootTarget && (
            <JustificationRootTargetViewer
              id={combineIds(id, "root-target")}
              {...rootTargetProps}
              suggestionsKey={
                suggestionsKey &&
                combineSuggestionsKeys(suggestionsKey, "rootTarget")
              }
              showStatusText={showStatusText}
            />
          )}

          <div className="entity-status-text">
            created <span title={created}>{age}</span>
          </div>

          {_isCounter &&
            !doesCounterRootJustification &&
            doShowRootTarget &&
            expander}

          {_isCounter && doShowCounterTarget && (
            <JustificationChatBubble
              id={`target-justification-${justification.target.entity.id}`}
              justification={justification.target.entity}
              doShowControls={doShowControls}
              showBasisUrls={showBasisUrls}
              onClickWritQuoteUrl={onClickWritQuoteUrl}
              showStatusText={showStatusText}
            />
          )}
          <JustificationChatBubble
            justification={justification}
            doShowControls={doShowControls}
            showBasisUrls={showBasisUrls}
            onClickWritQuoteUrl={onClickWritQuoteUrl}
            showStatusText={showStatusText}
            contextTrailItems={contextTrailItems}
          />
        </div>
      }
    />
  );
}
