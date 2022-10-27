import {api, app} from '../actions'
import {AuthToken, DatetimeString, User} from 'howdju-common'
import {createReducer} from '@reduxjs/toolkit'
import { matchActions } from '@/reducerUtils'

const initialState = {
  authToken: null as AuthToken | null,
  authTokenExpiration: null as DatetimeString | null,
  user: null as User | null,
}

export default createReducer(initialState, builder => {
  builder.addCase(api.logout.response, () => initialState)
  builder.addCase(app.clearAuthToken, (state) => {
    state.authToken = null
    state.authTokenExpiration = null
  })
  builder.addMatcher(
    matchActions(
      api.login.response,
      api.confirmRegistration.response,
      api.confirmPasswordReset.response,
    ),
    (state, action) => {
      if (action.error) {
        return initialState
      }
      const {authToken, expires: authTokenExpiration, user} = action.payload
      return {...state, authToken, authTokenExpiration, user}
    },
  )
})
