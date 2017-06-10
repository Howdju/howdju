import React, {Component} from "react"
import Button from 'react-md/lib/Buttons'
import { connect } from 'react-redux'
import DocumentTitle from 'react-document-title'
import Card from 'react-md/lib/Cards'
import CardTitle from 'react-md/lib/Cards/CardTitle';
import CardActions from 'react-md/lib/Cards/CardActions';
import {goBack} from "react-router-redux";
import CardText from 'react-md/lib/Cards/CardText';
import { Switch } from 'react-md/lib/SelectionControls'
import cn from 'classnames'
import get from 'lodash/get'
import queryString from 'query-string'


import {
  api,
  editors,
  flows,
  mapActionCreatorGroupToDispatchToProps,
  ui,
} from './actions'
import text, {
  default as t,
  ADD_JUSTIFICATION_TO_CREATE_STATEMENT,
  CREATE_JUSTIFICATION_SUBMIT_BUTTON_LABEL,
  CREATE_JUSTIFICATION_SUBMIT_BUTTON_TITLE, CREATE_JUSTIFICATION_TITLE,
  CREATE_STATEMENT_SUBMIT_BUTTON_LABEL,
  CREATE_STATEMENT_SUBMIT_BUTTON_TITLE, CREATE_STATEMENT_TITLE, JUSTIFICATION_TITLE,
} from "./texts";
import { suggestionKeys } from './autocompleter'
import {consolidateBasis, makeNewStatementJustification} from "./models";
import {
  editStatementJustificationPageEditorId,
} from "./editorIds"
import {logger} from "./util";
import JustificationEditor from "./JustificationEditor";
import StatementEditor from "./StatementEditor";
import {EditorTypes} from "./reducers/editors";

export const EditStatementJustificationPageMode = {
  /** Blank editors, optionally show and create a justification with the statement */
  CREATE_STATEMENT: 'CREATE_STATEMENT',
  /** Blank statement editor, pre-populated justification information (e.g. citation reference from bookmarklet)
   *
   * Hide the citation switch.
   */
  CREATE_JUSTIFICATION: 'CREATE_JUSTIFICATION',
}

const titleTextKeyByMode = {
  [EditStatementJustificationPageMode.CREATE_STATEMENT]: CREATE_STATEMENT_TITLE,
  [EditStatementJustificationPageMode.CREATE_JUSTIFICATION]: CREATE_JUSTIFICATION_TITLE,
}
const submitButtonLabelTextKeyByMode = {
  [EditStatementJustificationPageMode.CREATE_STATEMENT]: CREATE_STATEMENT_SUBMIT_BUTTON_LABEL,
  [EditStatementJustificationPageMode.CREATE_JUSTIFICATION]: CREATE_JUSTIFICATION_SUBMIT_BUTTON_LABEL,
}
const submitButtonTitleTextKeyByMode = {
  [EditStatementJustificationPageMode.CREATE_STATEMENT]: CREATE_STATEMENT_SUBMIT_BUTTON_TITLE,
  [EditStatementJustificationPageMode.CREATE_JUSTIFICATION]: CREATE_JUSTIFICATION_SUBMIT_BUTTON_TITLE,
}

class EditStatementJustificationPage extends Component {

  constructor() {
    super()

    this.onPropertyChange = this.onPropertyChange.bind(this)
    this.addJustificationUrl = this.addJustificationUrl.bind(this)
    this.deleteJustificationUrl = this.deleteJustificationUrl.bind(this)
    this.onDoCreateJustificationSwitchChange = this.onDoCreateJustificationSwitchChange.bind(this)
    this.onSubmit = this.onSubmit.bind(this)
    this.onCancel = this.onCancel.bind(this)

    this.editorId = editStatementJustificationPageEditorId
    this.editorType = EditorTypes.STATEMENT_JUSTIFICATION
  }

  componentWillMount() {
    switch (this.props.mode) {
      case EditStatementJustificationPageMode.CREATE_STATEMENT:
        this.props.editors.beginEdit(this.editorType, this.editorId, makeNewStatementJustification())
        break
      case EditStatementJustificationPageMode.CREATE_JUSTIFICATION:
        const {
          basisType,
          basisId,
        } = this.props.queryParams
        this.props.flows.fetchAndBeginEditOfNewJustificationFromBasis(this.editorType, this.editorId, basisType, basisId)
        break
    }
  }

  onPropertyChange(properties) {
    this.props.editors.propertyChange(this.editorType, this.editorId, properties)
  }

  addJustificationUrl() {
    this.props.editors.addUrl(this.editorType, this.editorId)
  }

  deleteJustificationUrl(url, index) {
    this.props.editors.deleteUrl(this.editorType, this.editorId, url, index)
  }

  onDoCreateJustificationSwitchChange(checked) {
    this.props.editors.propertyChange(this.editorType, this.editorId, {doCreateJustification: checked})
  }

  onSubmit(event) {
    event.preventDefault()

    switch (this.props.mode) {
      case EditStatementJustificationPageMode.CREATE_STATEMENT: {
        if (this.props.doCreateJustification) {
          const justification = consolidateBasis(this.props.justification)
          this.props.flows.createStatementJustificationThenView(this.props.statement, justification)
        } else {
          this.props.flows.createStatementThenView(this.props.statement)
        }
        break
      }
      case EditStatementJustificationPageMode.CREATE_JUSTIFICATION: {
        const justification = consolidateBasis(this.props.justification)
        this.props.flows.createStatementJustificationThenView(this.props.statement, justification)
        break
      }
      default: {
        logger.warn("onSubmit has unhandled mode", this.props.mode)
      }
    }
  }

  onCancel() {
    this.props.goBack()
  }

  render() {
    const {
      mode,
      statement,
      justification,
      inProgress,
      doCreateJustification,
    } = this.props

    const errorMessage = ''

    const title = text(titleTextKeyByMode[mode])
    const submitButtonLabel = text(submitButtonLabelTextKeyByMode[mode])
    const submitButtonTitle = text(submitButtonTitleTextKeyByMode[mode])

    const isCreateJustification = mode === EditStatementJustificationPageMode.CREATE_JUSTIFICATION

    return (
        <DocumentTitle title={`Howdju - ${title}`}>
          <form onSubmit={this.onSubmit}>
            <div id="addStatementPage" className="md-grid">
              <div className="md-cell md-cell--12">

                <Card>
                  <CardTitle title={title} />

                  <CardText className={cn({
                    errorMessage: true,
                    hidden: !errorMessage
                  })}>
                    {errorMessage}
                  </CardText>
                  <CardText>
                    <StatementEditor statement={statement}
                                     id="statement"
                                     name="statement"
                                     suggestionsKey={suggestionKeys.createStatementPageStatement}
                                     onPropertyChange={this.onPropertyChange}
                    />
                  </CardText>

                  <Switch id="doCreateJustificationSwitch"
                          name="doCreateJustification"
                          label={text(ADD_JUSTIFICATION_TO_CREATE_STATEMENT)}
                          className={cn({hidden: isCreateJustification})}
                          checked={doCreateJustification}
                          onChange={this.onDoCreateJustificationSwitchChange} />

                  <CardTitle title={t(JUSTIFICATION_TITLE)}
                             className={cn({hidden: !isCreateJustification && !doCreateJustification})}
                  />

                  <CardText className={cn({hidden: !isCreateJustification && !doCreateJustification})}>
                    <JustificationEditor justification={justification}
                                         name="justification"
                                         suggestionsKey="justification"
                                         readOnlyBasis={isCreateJustification}
                                         onPropertyChange={this.onPropertyChange}
                                         onAddUrlClick={this.addJustificationUrl}
                                         onDeleteUrlClick={this.deleteJustificationUrl}
                    />
                  </CardText>

                  <CardActions>
                    <Button raised
                            primary
                            type="submit"
                            label={submitButtonLabel}
                            title={submitButtonTitle}
                            disabled={inProgress}
                    />
                    <Button flat
                            label="Cancel"
                            disabled={inProgress}
                            onClick={this.onCancel}
                    />
                  </CardActions>

                </Card>

              </div>
            </div>
          </form>
        </DocumentTitle>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  const editorState = get(state.editors, [EditorTypes.STATEMENT_JUSTIFICATION, editStatementJustificationPageEditorId], {})
  const errors = editorState.errors
  const editEntity = get(editorState, 'editEntity', makeNewStatementJustification())
  const queryParams = queryString.parse(ownProps.location.search)
  return {
    ...editEntity,
    errors,
    queryParams,
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  api,
  editors,
  ui,
  flows,
}, {
  goBack,
}))(EditStatementJustificationPage)