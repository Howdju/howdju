import {LOCATION_CHANGE} from 'react-router-redux'
import { parsePath } from 'history'

import {
  app, mainSearch,
} from './ui'
import paths from '../../paths'

describe('reducers', () => {

  describe('ui', () => {

    describe('main search', () => {

      test('should clear the search text when navigating to a non-search page', () => {
        const initialState = {mainSearchText: 'non-empty'}
        const action = {
          type: LOCATION_CHANGE,
          payload: parsePath(paths.home()),
        }
        const newState = mainSearch(initialState, action)
        expect(newState.mainSearchText).toEqual('')
      })

      test('should not clear the search when navigating to the search page', () => {
        const mainSearchText = 'non-empty'
        const initialState = {mainSearchText}
        const action = {
          type: LOCATION_CHANGE,
          payload: parsePath(paths.mainSearch(mainSearchText)),
        }
        const newState = app(initialState, action)
        expect(newState.mainSearchText).toEqual(mainSearchText)
      })

      // test('should load search results on page load')

      // test('should not load search results on navigation')
    })

  })

})
