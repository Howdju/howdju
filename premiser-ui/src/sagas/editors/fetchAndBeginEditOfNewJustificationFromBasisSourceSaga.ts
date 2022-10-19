import { Action } from "redux-actions";
import { put, call, takeEvery } from "redux-saga/effects";

import {
  JustificationBasisSourceTypes,
  newExhaustedEnumError,
  makePropositionCompoundFromProposition,
  JustificationBasisSourceType,
  EntityId,
  JustificationBasisType,
  PropositionCompound,
  WritQuote,
  Proposition,
  newUnimplementedError,
} from "howdju-common";
import {
  JustificationBasisFormInputModel,
  makeJustifiedPropositionFormInputModel,
  makePropositionCompoundFormInputModel,
  makeSourceExcerptFormInputModel,
  makeWritQuoteFormInputModel,
  PropositionCompoundFormInputModel,
  SourceExcerptFormInputModel,
  WritQuoteFormInputModel,
} from "howdju-client-common";

import { api, editors, flows, str } from "@/actions";
import {
  removePropositionCompoundIds,
  removePropositionIds,
  removeWritQuoteIds,
} from "@/viewModels";
import { callApiForResource } from "@/sagas/resourceApiSagas";
import { EditorType } from "@/reducers/editors";
import { EditorId } from "@/types";

export function* fetchAndBeginEditOfNewJustificationFromBasisSource() {
  yield takeEvery(
    str(flows.fetchAndBeginEditOfNewJustificationFromBasisSource),
    function* fetchAndBeginEditOfNewJustificationFromBasisSourceWorker(
      action: Action<{
        editorId: EditorId;
        editorType: EditorType;
        basisSourceType: JustificationBasisSourceType;
        basisSourceId: EntityId;
      }>
    ) {
      const { editorId, editorType, basisSourceType, basisSourceId } =
        action.payload;

      const actionCreator =
        fetchActionCreatorForBasisSourceType(basisSourceType);
      const fetchResponseAction: any = yield call(
        callApiForResource,
        actionCreator(basisSourceId)
      );
      if (!fetchResponseAction.error) {
        const alternatives = extractBasisSourceFromFetchResponseAction(
          basisSourceType,
          fetchResponseAction
        );

        let type: JustificationBasisType
        let propositionCompound: PropositionCompoundFormInputModel | undefined
        let writQuote: WritQuoteFormInputModel | undefined
        let sourceExcerpt: SourceExcerptFormInputModel | undefined

        switch (alternatives.basisType) {
          case JustificationBasisSourceTypes.PROPOSITION_COMPOUND:
            type = "PROPOSITION_COMPOUND"
            propositionCompound = removePropositionCompoundIds(alternatives.propositionCompound);
            break;
          case JustificationBasisSourceTypes.PROPOSITION: {
            type = "PROPOSITION_COMPOUND"
            const proposition = removePropositionIds(alternatives.proposition);
            propositionCompound =
              makePropositionCompoundFromProposition(proposition);
            break;
          }
          case JustificationBasisSourceTypes.WRIT_QUOTE:
            type = "WRIT_QUOTE"
            writQuote = removeWritQuoteIds(alternatives.writQuote);
            sourceExcerpt = makeSourceExcerptFormInputModel({writQuote});
            break;
          default:
            throw newExhaustedEnumError(alternatives);
        }

        const basis: JustificationBasisFormInputModel = {
          type,
          propositionCompound: propositionCompound || makePropositionCompoundFormInputModel(),
          writQuote: writQuote || makeWritQuoteFormInputModel(),
          sourceExcerpt: sourceExcerpt || makeSourceExcerptFormInputModel(),
        };

        const editModel = makeJustifiedPropositionFormInputModel({}, { basis });
        yield put(editors.beginEdit(editorType, editorId, editModel));
      }
    }
  );
}

function fetchActionCreatorForBasisSourceType(
  basisType: JustificationBasisSourceType
) {
  switch (basisType) {
    case JustificationBasisSourceTypes.PROPOSITION_COMPOUND:
      return api.fetchPropositionCompound;
    case JustificationBasisSourceTypes.WRIT_QUOTE:
      return api.fetchWritQuote;
    case JustificationBasisSourceTypes.PROPOSITION:
      return api.fetchProposition;
    case JustificationBasisSourceTypes.JUSTIFICATION_BASIS_COMPOUND:
    case JustificationBasisSourceTypes.SOURCE_EXCERPT_PARAPHRASE:
      throw newUnimplementedError(`Unsupported basis type: ${basisType}`);
    default:
      throw newExhaustedEnumError(basisType);
  }
}

type PropositionSourceAlternatives =
  | {
    basisType: "PROPOSITION_COMPOUND",
    propositionCompound: PropositionCompound,
    writQuote: undefined,
    proposition: undefined,
  }
  | {
    basisType: "WRIT_QUOTE",
    propositionCompound: undefined,
    writQuote: WritQuote,
    proposition: undefined,
  }
  | {
    basisType: "PROPOSITION",
    propositionCompound: undefined,
    writQuote: undefined,
    proposition: Proposition,
  }

function extractBasisSourceFromFetchResponseAction(
  basisType: JustificationBasisSourceType,
  fetchResponseAction: Action<{
    propositionCompound: PropositionCompound,
    writQuote: WritQuote,
    proposition: Proposition,
  }>
): PropositionSourceAlternatives {
  const {
    propositionCompound,
    writQuote,
    proposition,
  } = fetchResponseAction.payload
  const alternatives = {
    propositionCompound: undefined,
    writQuote: undefined,
    proposition: undefined,
  }
  switch (basisType) {
    case JustificationBasisSourceTypes.PROPOSITION_COMPOUND:
      return {
        ...alternatives,
        basisType,
        propositionCompound
      }
    case JustificationBasisSourceTypes.WRIT_QUOTE:
      return {
        ...alternatives,
        basisType,
        writQuote,
      }
    case JustificationBasisSourceTypes.PROPOSITION:
      return {...alternatives, basisType, proposition}
    case JustificationBasisSourceTypes.JUSTIFICATION_BASIS_COMPOUND:
    case JustificationBasisSourceTypes.SOURCE_EXCERPT_PARAPHRASE:
      throw newUnimplementedError(`Unsupported basis type: ${basisType}`);
    default:
      throw newExhaustedEnumError(basisType);
  }
}
