import React from 'react'
import ReactDOM from 'react-dom'
import { createStore } from 'redux'
import { AppContainer as ReactHotLoaderContainer } from 'react-hot-loader'
import AppContainer from './AppContainer'
import appReducer from './reducers'
import Statement from './Statement'
import Justification from './Justification'
import { Quote, WebSource, Citation, JustificationTarget } from './models'
import { Provider } from 'react-redux'
import { Map } from 'immutable'

const root = document.getElementById('root')
const initialState = {
  statementPage: {
    activeStatementId: 1,
  },
  statementsById: {
    1: new Statement({
      id: 1,
      text: "The American Health Care Reform Act of 2017 (H.R.277) is an improvement over The Affordable Care Act"
    }),
  },
  justificationsById: Map({
    1: new Justification({
      id: 1,
      target: new JustificationTarget({ type: 'STATEMENT', targetId: 1 }),
      type: 'STATEMENT',
      basis: new Statement({text: "The American Health Care Reform Act of 2017 will reduce federal deficits by $337 by 2026"}),
      polarity: 'positive',
      score: 1,
    }),
    2: new Justification({
      id: 2,
      target: new JustificationTarget({ type: 'STATEMENT', targetId: 1 }),
      type: 'STATEMENT',
      basis: new Statement({text: "The AHCA will uninsure 14 million people by 2018"}),
      polarity: 'negative',
      score: 2,
    }),
    3: new Justification({
      id: 3,
      target: new JustificationTarget({ type: 'STATEMENT', targetId: 1 }),
      type: 'STATEMENT',
      basis: new Statement({text: "The AHCA is shorter than the ACA"}),
      polarity: 'positive',
      score: 3,
    }),
    4: new Justification({
      id: 4,
      target: new JustificationTarget({ type: 'STATEMENT', targetId: 1 }),
      type: 'STATEMENT',
      basis: new Statement({text: "The AHCA removes the penalty for choosing not to have health insurance"}),
      polarity: 'positive',
      score: 4,
    }),
    5: new Justification({
      id: 5,
      target: new JustificationTarget({ type: 'STATEMENT', targetId: 1 }),
      type: 'STATEMENT',
      basis: new Statement({text: "The removal of the individual mandate will drive up insurance costs and emergency care costs"}),
      polarity: 'negative',
      score: 5,
    }),
    6: new Justification({
      id: 6,
      target: new JustificationTarget({ type: 'STATEMENT', targetId: 1 }),
      type: 'QUOTE',
      basis: new Quote({
        text: 'Generally, people who are older, lower-income, or live in high-premium areas (like Alaska and Arizona) ' +
        'receive larger tax credits under the ACA than they would under the American Health Care Act replacement.',
        citation: new Citation({
          title: 'Tax Credits under the Affordable Care Act vs. the American Health Care Act: An Interactive Map',
          sources: [
            new WebSource({
              url: 'http://kff.org/interactive/tax-credits-under-the-affordable-care-act-vs-replacement-proposal-interactive-map/',
            })
          ]
        }),
      }),
      polarity: 'negative',
      score: 6,
    })
  })
}
let store = createStore(appReducer, initialState)

const renderInHotLoader = Component => {
  ReactDOM.render(
      <ReactHotLoaderContainer>
        <Provider store={store}>
          <Component />
        </Provider>
      </ReactHotLoaderContainer>,
      root
  )
}

renderInHotLoader(AppContainer)

// https://github.com/gaearon/react-hot-loader/tree/master/docs#webpack-2
if (module.hot) {
  module.hot.accept('./AppContainer', () => { renderInHotLoader(AppContainer) })
}