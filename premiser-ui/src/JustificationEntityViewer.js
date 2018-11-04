import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {Button} from 'react-md'
import moment from 'moment'

import {
  isCounter,
  isRootJustification,
} from "howdju-common"

import EntityViewer from './EntityViewer'
import JustificationRootTargetViewer from './JustificationRootTargetViewer'
import JustificationChatBubble from "./JustificationChatBubble"
import config from './config'
import {
  combineIds,
  combineSuggestionsKeys,
} from './viewModels'


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
    } = this.props

    const _isCounter = isCounter(justification)
    const _doesCounterRootJustification = _isCounter && isRootJustification(justification.target.entity)

    const age = justification.created ? moment(justification.created).fromNow() : ''
    const created = justification.created ? moment(justification.created).format(config.humanDateTimeFormat) : ''

    const expander = (
      <div className="justification-expander-wrapper">
        <Button icon onClick={onExpandJustifications}>more_horiz</Button>
      </div>
    )

    return (
      <EntityViewer
        component={component}
        iconName="merge_type"
        iconTitle="Justification"
        entity={
          <div>
            <JustificationRootTargetViewer
              id={combineIds(id, 'root-target')}
              justification={justification}
              suggestionsKey={combineSuggestionsKeys(suggestionsKey, 'rootTarget')}
            />

            <div className="entity-status-text">
              created <span title={created}>{age}</span>
            </div>

            {_isCounter && !_doesCounterRootJustification && expander}

            {_isCounter && (
              <JustificationChatBubble
                id={`target-justification-${justification.target.entity.id}`}
                justification={justification.target.entity}
                doShowBasisJustifications={doShowBasisJustifications}
                doShowControls={doShowControls}
                showBasisUrls={showBasisUrls}
              />
            )}
            <JustificationChatBubble
              justification={justification}
              doShowBasisJustifications={doShowBasisJustifications}
              doShowControls={doShowControls}
              showBasisUrls={showBasisUrls}
            />
          </div>
        }
      />
    )
  }
}
JustificationEntityViewer.propTypes = {
  id: PropTypes.string.isRequired,
  paraphrasingPropositionEditorId: PropTypes.string,
  sourceExcerptEditorId: PropTypes.string,
}
