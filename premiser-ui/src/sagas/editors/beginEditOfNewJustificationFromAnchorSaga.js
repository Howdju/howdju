import {
  put,
  takeEvery,
} from 'redux-saga/effects'

import {
  makeNewPropositionJustification,
  JustificationBasisType,
  makeNewJustificationBasisCompoundFromWritQuote,
} from 'howdju-common'

import {editors, flows, str, goto} from '../../actions'
import CreatePropositionPage from '../../CreatePropositionPage'

export function* beginEditOfNewJustificationFromAnchor() {
  yield takeEvery(str(flows.beginEditOfNewJustificationFromAnchor), function* beginEditOfNewJustificationFromAnchorWorker(action) {
    const {content, source, target} = action.payload
    const propositionJustification = toPropositionJustification(content, source, target)
    yield put(editors.beginEdit(CreatePropositionPage.editorType, CreatePropositionPage.editorId, propositionJustification))
    yield put(goto.createJustification())
  })
}

function toPropositionJustification(content, source, target) {
  const {
    url,
    title: description,
  } = source
  const quoteText = content.text.trim()

  const writQuote = {
    quoteText,
    writ: {
      title: description
    },
    urls: [{url}]
  }
  const justificationProps = {
    basis: {
      type: JustificationBasisType.WRIT_QUOTE,
      writQuote,
      justificationBasisCompound: makeNewJustificationBasisCompoundFromWritQuote(writQuote),
    }
  }
  return makeNewPropositionJustification(null, justificationProps)
}