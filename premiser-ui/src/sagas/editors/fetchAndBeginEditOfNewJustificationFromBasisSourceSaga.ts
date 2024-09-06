import { Action } from "redux-actions";
import { put, call, takeEvery, select } from "typed-redux-saga";

import {
  JustificationBasisSourceTypes,
  newExhaustedEnumError,
  makeCreatePropositionCompoundInputFromProposition,
  JustificationBasisSourceType,
  EntityId,
  JustificationBasisType,
  newUnimplementedError,
  CreateWritQuoteInput,
  CreatePropositionCompoundInput,
  CreateSourceExcerptInput,
  CreateJustificationInputBasis,
  makeCreateJustifiedSentenceInput,
  makeCreatePropositionCompoundInput,
  makeCreateSourceExcerptInput,
  makeCreateWritQuoteInput,
  PropositionOut,
  WritQuoteOut,
  MediaExcerptOut,
  makeCreateMediaExcerptInput,
  PropositionCompoundView,
} from "howdju-common";
import {
  api,
  str,
  mediaExcerptSchema,
  propositionCompoundSchema,
  propositionSchema,
  writQuoteSchema,
} from "howdju-client-common";

import { editors, flows } from "@/actions";
import { callApiForResource } from "@/sagas/resourceApiSagas";
import { EditorType } from "@/reducers/editors";
import { EditorId } from "@/types";
import { denormalizedEntity } from "@/selectors";

export function* fetchAndBeginEditOfNewJustificationFromBasisSource() {
  yield* takeEvery(
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
      const fetchResponseAction = yield* call(
        callApiForResource,
        actionCreator(basisSourceId)
      );
      if (fetchResponseAction.error) {
        return;
      }
      const alternatives = yield* extractBasisSourceFromFetchResponseAction(
        basisSourceType,
        basisSourceId
      );

      let type: JustificationBasisType;
      let propositionCompound: CreatePropositionCompoundInput | undefined;
      let writQuote: CreateWritQuoteInput | undefined;
      let sourceExcerpt: CreateSourceExcerptInput | undefined;
      let mediaExcerpt: MediaExcerptOut | undefined;

      switch (alternatives.basisType) {
        case JustificationBasisSourceTypes.PROPOSITION_COMPOUND:
          type = "PROPOSITION_COMPOUND";
          propositionCompound = alternatives.propositionCompound;
          break;
        case "MEDIA_EXCERPT":
          type = "MEDIA_EXCERPT";
          mediaExcerpt = alternatives.mediaExcerpt;
          break;
        case JustificationBasisSourceTypes.PROPOSITION: {
          type = "PROPOSITION_COMPOUND";
          const proposition = alternatives.proposition;
          propositionCompound =
            makeCreatePropositionCompoundInputFromProposition(proposition);
          break;
        }
        case JustificationBasisSourceTypes.WRIT_QUOTE:
          type = "WRIT_QUOTE";
          writQuote = alternatives.writQuote;
          sourceExcerpt = makeCreateSourceExcerptInput({ writQuote });
          break;
        default:
          throw newExhaustedEnumError(alternatives);
      }

      const basis: CreateJustificationInputBasis = {
        type,
        propositionCompound:
          propositionCompound || makeCreatePropositionCompoundInput(),
        writQuote: writQuote || makeCreateWritQuoteInput(),
        sourceExcerpt: sourceExcerpt || makeCreateSourceExcerptInput(),
        mediaExcerpt: mediaExcerpt || makeCreateMediaExcerptInput(),
      };

      const model = makeCreateJustifiedSentenceInput({}, { basis });
      yield* put(editors.beginEdit(editorType, editorId, model));
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
    case "MEDIA_EXCERPT":
      return api.fetchMediaExcerpt;
    case JustificationBasisSourceTypes.SOURCE_EXCERPT_PARAPHRASE:
      throw newUnimplementedError(`Unsupported basis type: ${basisType}`);
    default:
      throw newExhaustedEnumError(basisType);
  }
}

type JustificationBasisAlternatives =
  | {
      basisType: "PROPOSITION_COMPOUND";
      propositionCompound: PropositionCompoundView;
      writQuote: undefined;
      proposition: undefined;
      mediaExcerpt: undefined;
    }
  | {
      basisType: "WRIT_QUOTE";
      propositionCompound: undefined;
      writQuote: WritQuoteOut;
      proposition: undefined;
      mediaExcerpt: undefined;
    }
  | {
      basisType: "PROPOSITION";
      propositionCompound: undefined;
      writQuote: undefined;
      proposition: PropositionOut;
      mediaExcerpt: undefined;
    }
  | {
      basisType: "MEDIA_EXCERPT";
      propositionCompound: undefined;
      writQuote: undefined;
      proposition: undefined;
      mediaExcerpt: MediaExcerptOut;
    };

function* extractBasisSourceFromFetchResponseAction(
  basisType: JustificationBasisSourceType,
  basisId: EntityId
): Generator<unknown, JustificationBasisAlternatives, unknown> {
  const alternatives = {
    propositionCompound: undefined,
    writQuote: undefined,
    proposition: undefined,
    mediaExcerpt: undefined,
  };
  switch (basisType) {
    case "PROPOSITION_COMPOUND": {
      const propositionCompound = yield* select(
        denormalizedEntity,
        basisId,
        propositionCompoundSchema
      );
      return {
        ...alternatives,
        basisType,
        propositionCompound,
      };
    }
    case "WRIT_QUOTE": {
      const writQuote = yield* select(
        denormalizedEntity,
        basisId,
        writQuoteSchema
      );
      return {
        ...alternatives,
        basisType,
        writQuote,
      };
    }
    case "PROPOSITION": {
      const proposition = yield* select(
        denormalizedEntity,
        basisId,
        propositionSchema
      );
      return { ...alternatives, basisType, proposition };
    }
    case "MEDIA_EXCERPT": {
      const mediaExcerpt = yield* select(
        denormalizedEntity,
        basisId,
        mediaExcerptSchema
      );
      return { ...alternatives, basisType, mediaExcerpt };
    }
    case "JUSTIFICATION_BASIS_COMPOUND":
    case "SOURCE_EXCERPT_PARAPHRASE":
      throw newUnimplementedError(`Unsupported basis type: ${basisType}`);
    default:
      throw newExhaustedEnumError(basisType);
  }
}
