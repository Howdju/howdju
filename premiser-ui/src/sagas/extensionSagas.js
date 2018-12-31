import {
  takeEvery,
} from 'redux-saga/effects'


import {extension as ext, actions} from 'howdju-client-common'

import {
  str,
} from "../actions"

const extensionId = 'amnnpakeakkebmgkgjjenjkbkhkgkadh'

export function* focusJustificationOnUrl() {
  yield takeEvery(str(actions.extension.focusJustificationOnUrl), function* focusJustificationOnUrlWorker(action) {
    ext.runtime.sendMessage(extensionId, action)
  })
}
