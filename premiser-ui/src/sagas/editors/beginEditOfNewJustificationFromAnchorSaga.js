import {
  put,
  takeEvery,
} from 'redux-saga/effects'

import {
  makeNewStatementJustification,
  JustificationBasisType,
  makeNewJustificationBasisCompoundFromWritQuote,
} from 'howdju-common'

import {editors, flows, str, goto} from '../../actions'
import CreateStatementPage from '../../CreateStatementPage'

export function* beginEditOfNewJustificationFromAnchor() {
  yield takeEvery(str(flows.beginEditOfNewJustificationFromAnchor), function* beginEditOfNewJustificationFromAnchorWorker(action) {
    const {content, source, target} = action.payload
    const statementJustification = toStatementJustification(content, source, target)
    yield put(editors.beginEdit(CreateStatementPage.editorType, CreateStatementPage.editorId, statementJustification))
    yield put(goto.createJustification())
  })
}

function toStatementJustification(content, source, target) {
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
  return makeNewStatementJustification(null, justificationProps)
}