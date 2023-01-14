import React, { Component, FormEvent } from "react";
import { connect, ConnectedProps } from "react-redux";
import { Link, RouteComponentProps } from "react-router-dom";
import { goBack } from "connected-react-router";
import {
  Button,
  Card,
  CardTitle,
  CardActions,
  CardText,
  CircularProgress,
  FocusContainer,
  FontIcon,
  Switch,
} from "react-md";
import cn from "classnames";
import get from "lodash/get";
import map from "lodash/map";
import { identity, isArray, keys, toString } from "lodash";
import queryString from "query-string";

import {
  JustificationBasisTypes,
  PropositionTagVotePolarities,
  makeCreateJustifiedSentenceInput,
  JustificationBasisSourceType,
  JustificationBasisSourceTypes,
  Tag,
  Persorg,
  CreateJustifiedSentenceInput,
  CreateJustifiedSentence,
  JustificationBasisType,
  ModelErrors,
  CreateProposition,
  CreateJustification,
} from "howdju-common";

import Helmet from "./Helmet";
import { editors, flows } from "./actions";
import paths from "./paths";
import t, {
  ADD_JUSTIFICATION_TO_CREATE_PROPOSITION,
  CREATE_JUSTIFICATION_SUBMIT_BUTTON_LABEL,
  CREATE_JUSTIFICATION_SUBMIT_BUTTON_TITLE,
  CREATE_JUSTIFICATION_TITLE,
  CREATE_PROPOSITION_SUBMIT_BUTTON_LABEL,
  CREATE_PROPOSITION_SUBMIT_BUTTON_TITLE,
  CREATE_PROPOSITION_TITLE,
  JUSTIFICATION_TITLE,
} from "./texts";
import {
  combineIds,
  combineNames,
  combineSuggestionsKeys,
  array,
} from "./viewModels";
import JustificationEditorFields from "@/editors/JustificationEditorFields";
import PropositionEditorFields from "./PropositionEditorFields";
import { EditorState, EditorTypes } from "./reducers/editors";
import TagsControl from "./TagsControl";
import { logger } from "./logger";
import PersorgEditorFields from "./PersorgEditorFields";
import EntityViewer from "./EntityViewer";
import { CreatePropositionPageMode, PropertyChanges } from "./types";
import { CreateJustificationConfig } from "./sagas/editors/editorCommitEditSaga";
import { RootState } from "./setupStore";
import { EditorFieldsActionCreator } from "./editors/withEditor";

const titleTextKeyByMode = {
  [CreatePropositionPageMode.CREATE_PROPOSITION]: CREATE_PROPOSITION_TITLE,
  [CreatePropositionPageMode.CREATE_JUSTIFICATION]: CREATE_JUSTIFICATION_TITLE,
  [CreatePropositionPageMode.SUBMIT_JUSTIFICATION_VIA_QUERY_STRING]:
    CREATE_JUSTIFICATION_TITLE,
};
const submitButtonLabelTextKeyByMode = {
  [CreatePropositionPageMode.CREATE_PROPOSITION]:
    CREATE_PROPOSITION_SUBMIT_BUTTON_LABEL,
  [CreatePropositionPageMode.CREATE_JUSTIFICATION]:
    CREATE_JUSTIFICATION_SUBMIT_BUTTON_LABEL,
  [CreatePropositionPageMode.SUBMIT_JUSTIFICATION_VIA_QUERY_STRING]:
    CREATE_JUSTIFICATION_SUBMIT_BUTTON_LABEL,
};
const submitButtonTitleTextKeyByMode = {
  [CreatePropositionPageMode.CREATE_PROPOSITION]:
    CREATE_PROPOSITION_SUBMIT_BUTTON_TITLE,
  [CreatePropositionPageMode.CREATE_JUSTIFICATION]:
    CREATE_JUSTIFICATION_SUBMIT_BUTTON_TITLE,
  [CreatePropositionPageMode.SUBMIT_JUSTIFICATION_VIA_QUERY_STRING]:
    CREATE_JUSTIFICATION_SUBMIT_BUTTON_TITLE,
};
const propositionName = "proposition";
const speakersName = "speakers";
const tagsName = "tags";
const doCreateJustificationName = "doCreateJustification";
const justificationName = "justification";

interface OwnProps extends RouteComponentProps {
  mode: CreatePropositionPageMode;
}
interface Props extends OwnProps, PropsFromRedux {}

class CreatePropositionPage extends Component<Props> {
  static id = "create-proposition-page";
  static editorType = EditorTypes.PROPOSITION_JUSTIFICATION;
  static editorId = CreatePropositionPage.id;

  componentDidMount() {
    this.initializeEditor();
  }

  initializeEditor = () => {
    switch (this.props.mode) {
      case CreatePropositionPageMode.CREATE_PROPOSITION:
        this.props.dispatch(
          editors.beginEdit(
            CreatePropositionPage.editorType,
            CreatePropositionPage.editorId,
            makeCreateJustifiedSentenceInput()
          )
        );
        break;
      case CreatePropositionPageMode.CREATE_JUSTIFICATION: {
        const { basisSourceType, basisSourceId } = this.props.queryParams;
        if (basisSourceType || basisSourceId) {
          // First clear out the editor
          this.props.dispatch(
            editors.cancelEdit(
              CreatePropositionPage.editorType,
              CreatePropositionPage.editorId
            )
          );
          if (!(basisSourceType && basisSourceId)) {
            logger.error(
              `If either of basisSourceType/basisSourceId are present, both must be: ${{
                basisSourceType,
                basisSourceId,
              }}`
            );
            return;
          }
          if (isArray(basisSourceType) || isArray(basisSourceId)) {
            logger.error(
              `basisSourceType/basisSourceId can only appear once (appeared multiple times.)`
            );
            return;
          }
          if (!(basisSourceType in JustificationBasisSourceTypes)) {
            logger.error(
              `basisSourceType must be one of ${keys(
                JustificationBasisSourceTypes
              ).join(", ")}`
            );
          }
          // Then fetch the stuff for editing
          this.props.dispatch(
            flows.fetchAndBeginEditOfNewJustificationFromBasisSource(
              CreatePropositionPage.editorType,
              CreatePropositionPage.editorId,
              basisSourceType as JustificationBasisSourceType,
              basisSourceId
            )
          );
        }
        // if neither basisSourceType or basisSourceId is present in the queryParams, then the editorModel should
        // already be present, e.g. from the browser extension.  We could check that here, I think.
        break;
      }
      case CreatePropositionPageMode.SUBMIT_JUSTIFICATION_VIA_QUERY_STRING: {
        const { url, description, quoteText } = this.props.queryParams;
        if (isArray(url) || isArray(description) || isArray(quoteText)) {
          logger.error(
            "url/description/quoteText can only appear once in query params."
          );
          return;
        }
        const writQuote = {
          quoteText: quoteText || undefined,
          writ: {
            title: description || undefined,
          },
          urls: url ? [{ url }] : [],
        };
        const justificationProps = {
          basis: {
            type: JustificationBasisTypes.WRIT_QUOTE as JustificationBasisType,
            writQuote,
          },
        };
        const justifiedProposition = makeCreateJustifiedSentenceInput(
          {},
          justificationProps
        );
        this.props.dispatch(
          editors.beginEdit(
            CreatePropositionPage.editorType,
            CreatePropositionPage.editorId,
            justifiedProposition
          )
        );
        break;
      }
      default: {
        logger.warn(
          `unsupported CreatePropositionPageMode: ${this.props.mode}`
        );
      }
    }
  };
  onAddSpeakerClick = () => {
    this.props.dispatch(
      editors.addSpeaker(
        CreatePropositionPage.editorType,
        CreatePropositionPage.editorId
      )
    );
  };
  onRemoveSpeakerClick = (speaker: Persorg, index: number) => {
    this.props.dispatch(
      editors.removeSpeaker(
        CreatePropositionPage.editorType,
        CreatePropositionPage.editorId,
        speaker,
        index
      )
    );
  };
  onPersorgAutocomplete = (persorg: Persorg, index: number) => {
    this.props.dispatch(
      editors.replaceSpeaker(
        CreatePropositionPage.editorType,
        CreatePropositionPage.editorId,
        persorg,
        index
      )
    );
  };
  onPropertyChange = (properties: PropertyChanges) => {
    this.props.dispatch(
      editors.propertyChange(
        CreatePropositionPage.editorType,
        CreatePropositionPage.editorId,
        properties
      )
    );
  };
  onDoCreateJustificationSwitchChange = (checked: boolean) => {
    this.props.dispatch(
      editors.propertyChange(
        CreatePropositionPage.editorType,
        CreatePropositionPage.editorId,
        { [doCreateJustificationName]: checked }
      )
    );
  };
  onTagProposition = (tag: Tag) => {
    this.props.dispatch(
      editors.tagProposition(
        CreatePropositionPage.editorType,
        CreatePropositionPage.editorId,
        tag
      )
    );
  };
  onUnTagProposition = (tag: Tag) => {
    this.props.dispatch(
      editors.unTagProposition(
        CreatePropositionPage.editorType,
        CreatePropositionPage.editorId,
        tag
      )
    );
  };
  onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    this.props.dispatch(
      flows.commitEditThenView(
        CreatePropositionPage.editorType,
        CreatePropositionPage.editorId
      )
    );
  };
  onCancel = () => {
    this.props.dispatch(goBack());
  };
  render() {
    const { mode, editorState } = this.props;
    if (!editorState) {
      return (
        <CircularProgress id="create-proposition-page-circular-progress" />
      );
    }
    const { errors, isSaving, editEntity, wasSubmitAttempted } = editorState;
    const { proposition, speakers, justification, doCreateJustification } =
      editEntity || {};
    // const isEditing = !!editEntity
    const id = CreatePropositionPage.id;
    const title = t(titleTextKeyByMode[mode]);
    const submitButtonLabel = t(submitButtonLabelTextKeyByMode[mode]);
    const submitButtonTitle = t(submitButtonTitleTextKeyByMode[mode]);
    const isCreateJustificationMode =
      mode === CreatePropositionPageMode.CREATE_JUSTIFICATION;
    const propositionErrors =
      errors && (doCreateJustification ? get(errors, "target.entity") : errors);
    const { responseErrorTransformer = identity, inputTransformer = identity } =
      CreateJustificationConfig;
    const createJustification =
      justification && inputTransformer(justification);
    const justificationFormInputErrors =
      createJustification &&
      errors &&
      responseErrorTransformer(createJustification, errors);
    const propositionTags = get(proposition, "tags");
    const propositionTagVotes = get(proposition, "propositionTagVotes");
    const propositionEditorText = "propositionEditorText";
    const hasSpeakers = speakers && speakers.length > 0;
    const doShowTypeSelection = !isCreateJustificationMode;

    const editorDispatch = (actionCreator: EditorFieldsActionCreator) => {
      const action = actionCreator(
        CreatePropositionPage.editorType,
        CreatePropositionPage.editorId
      );
      if (isArray(action)) {
        for (const a of action) {
          this.props.dispatch(a);
        }
      } else {
        this.props.dispatch(action);
      }
    };

    return (
      <div id="edit-proposition-justification-page">
        <Helmet>
          <title>{title} — Howdju</title>
        </Helmet>
        {mode === CreatePropositionPageMode.CREATE_PROPOSITION && (
          <div className="md-grid">
            <div className="md-cell md-cell--12">
              <p>
                The{" "}
                <Link to={paths.tools()}>Chrome extension & bookmarklet</Link>{" "}
                are convenient ways to create justifications based upon web
                pages you visit
              </p>
            </div>
          </div>
        )}
        <form onSubmit={this.onSubmit}>
          <FocusContainer
            initialFocus={"#" + propositionEditorText}
            containFocus={false}
            focusOnMount={true}
          >
            <div className="md-grid">
              <div className="md-cell md-cell--12">
                <Card>
                  <CardTitle title={title} />

                  <CardText>
                    <Button
                      flat
                      iconEl={<FontIcon>person_add</FontIcon>}
                      title={"Add Speaker"}
                      onClick={this.onAddSpeakerClick}
                      disabled={isSaving}
                    >
                      Add Speaker
                    </Button>
                    {hasSpeakers && (
                      <div className="md-grid">
                        <div className="md-cell md-cell--6">
                          {map(speakers, (speaker, index) => (
                            <div key={index}>
                              <EntityViewer
                                iconName="person"
                                iconTitle="Person/Organization"
                                menu={
                                  <Button
                                    icon
                                    onClick={() =>
                                      this.onRemoveSpeakerClick(speaker, index)
                                    }
                                    title="Delete speaker"
                                  >
                                    delete
                                  </Button>
                                }
                                entity={
                                  <PersorgEditorFields
                                    id={combineIds(
                                      id,
                                      speakersName,
                                      toString(index)
                                    )}
                                    key={combineIds(
                                      id,
                                      speakersName,
                                      toString(index)
                                    )}
                                    persorg={speaker}
                                    suggestionsKey={combineSuggestionsKeys(
                                      id,
                                      speakersName,
                                      toString(index)
                                    )}
                                    name={combineNames(
                                      speakersName,
                                      array(index)
                                    )}
                                    disabled={isSaving}
                                    onPersorgNameAutocomplete={(
                                      persorg: Persorg
                                    ) =>
                                      this.onPersorgAutocomplete(persorg, index)
                                    }
                                    onPropertyChange={this.onPropertyChange}
                                    onSubmit={this.onSubmit}
                                  />
                                }
                              />
                              <div>Said that:</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardText>

                  <CardText>
                    <PropositionEditorFields
                      id={combineIds(id, propositionName)}
                      textId={propositionEditorText}
                      proposition={proposition}
                      name={propositionName}
                      suggestionsKey={combineSuggestionsKeys(
                        id,
                        propositionName
                      )}
                      onPropertyChange={this.onPropertyChange}
                      errors={propositionErrors}
                      disabled={isSaving}
                      onSubmit={this.onSubmit}
                    />
                    <TagsControl
                      id={combineIds(id, tagsName)}
                      tags={propositionTags}
                      votes={propositionTagVotes}
                      name={combineNames(propositionName, tagsName)}
                      suggestionsKey={combineSuggestionsKeys(id, tagsName)}
                      votePolarity={{
                        POSITIVE: PropositionTagVotePolarities.POSITIVE,
                        NEGATIVE: PropositionTagVotePolarities.NEGATIVE,
                      }}
                      onTag={this.onTagProposition}
                      onUnTag={this.onUnTagProposition}
                      onSubmit={this.onSubmit}
                    />
                  </CardText>

                  {!isCreateJustificationMode && (
                    <Switch
                      id={combineIds(id, doCreateJustificationName)}
                      name={doCreateJustificationName}
                      label={t(ADD_JUSTIFICATION_TO_CREATE_PROPOSITION)}
                      checked={doCreateJustification}
                      onChange={this.onDoCreateJustificationSwitchChange}
                      disabled={isSaving}
                    />
                  )}

                  <CardTitle
                    title={t(JUSTIFICATION_TITLE)}
                    className={cn({
                      hidden:
                        !isCreateJustificationMode && !doCreateJustification,
                    })}
                  />

                  <CardText
                    className={cn({
                      hidden:
                        !isCreateJustificationMode && !doCreateJustification,
                    })}
                  >
                    <JustificationEditorFields
                      justification={justification}
                      id={combineIds(id, justificationName)}
                      name={justificationName}
                      suggestionsKey={combineSuggestionsKeys(
                        id,
                        justificationName
                      )}
                      disabled={isSaving}
                      doShowTypeSelection={doShowTypeSelection}
                      onPropertyChange={this.onPropertyChange}
                      onSubmit={this.onSubmit}
                      errors={justificationFormInputErrors}
                      editorDispatch={editorDispatch}
                      wasSubmitAttempted={wasSubmitAttempted}
                    />
                  </CardText>

                  <CardActions>
                    {isSaving && (
                      <CircularProgress key="progress" id="progress" />
                    )}
                    <Button
                      flat
                      children="Cancel"
                      disabled={isSaving}
                      onClick={this.onCancel}
                    />
                    <Button
                      raised
                      primary
                      type="submit"
                      children={submitButtonLabel}
                      title={submitButtonTitle}
                      disabled={isSaving}
                    />
                  </CardActions>
                </Card>
              </div>
            </div>
          </FocusContainer>
        </form>
      </div>
    );
  }
}
const mapStateToProps = (state: RootState, ownProps: OwnProps) => {
  const editorState = get(state.editors, [
    CreatePropositionPage.editorType,
    CreatePropositionPage.editorId,
  ]) as EditorState<
    CreateJustifiedSentenceInput,
    CreateJustifiedSentence,
    // The editor submits either a proposition or justification.
    ModelErrors<CreateProposition | CreateJustification>
  >;
  const queryParams = queryString.parse(ownProps.location.search);
  return {
    editorState,
    queryParams,
  };
};
const connector = connect(mapStateToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(CreatePropositionPage);
