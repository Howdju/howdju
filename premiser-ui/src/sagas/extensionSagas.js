import {
  takeEvery,
} from 'redux-saga/effects'


import {extension, actions} from 'howdju-client-common'

import {
  str,
} from "../actions"

const extensionId = 'amnnpakeakkebmgkgjjenjkbkhkgkadh'

export function* focusJustificationOnUrl() {
  yield takeEvery(str(actions.extension.focusJustificationOnUrl), function* focusJustificationOnUrlWorker(action) {
    extension.sendMessage(extensionId, action)
  })
}
