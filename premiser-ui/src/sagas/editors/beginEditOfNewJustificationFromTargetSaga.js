import {
  put,
  takeEvery,
} from 'redux-saga/effects'

import {
  makeJustifiedPropositionEditModel,
  JustificationBasisTypes,
} from 'howdju-common'

import {editors, flows, str, goto} from '../../actions'
import CreatePropositionPage from '../../CreatePropositionPage'

export function* beginEditOfNewJustificationFromTarget() {
  yield takeEvery(str(flows.beginEditOfNewJustificationFromTarget), function* beginEditOfNewJustificationFromTargetWorker(action) {
    const {content, source, target} = action.payload
    const propositionJustification = toPropositionJustification(content, source, target)
    yield put(editors.beginEdit(CreatePropositionPage.editorType, CreatePropositionPage.editorId, propositionJustification))
    yield put(goto.createJustification())
  })
}

function toPropositionJustification(content, source, target) {
  const {
    title,
  } = source
  const quoteText = content.text.trim()
  const {url} = target

  const writQuote = {
    quoteText,
    writ: {
      title,
    },
    urls: [{url, target}],
  }
  const justificationProps = {
    basis: {
      type: JustificationBasisTypes.WRIT_QUOTE,
      writQuote,
    },
  }
  return makeJustifiedPropositionEditModel(null, justificationProps)
}
