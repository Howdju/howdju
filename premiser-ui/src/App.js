import React, { Component, PropTypes } from 'react'
import { Route, IndexRoute } from 'react-router'
import { BrowserRouter as Router } from 'react-router-dom'
import Header from './Header'
import HomePage from './HomePage'
import StatementJustificationsPage from './StatementJustificationsPage'
import LoginPage from './LoginPage'

export default class App extends Component {
  render () {
    return (
      <Router>
        <div id="app">

          <Header/>

          <Route exact path="/" component={HomePage} />
          <Route path="/login" component={LoginPage} />
          <Route path="/s/:statementId/:statementSlug" component={StatementJustificationsPage} />

        </div>
      </Router>
    )
  }
}
