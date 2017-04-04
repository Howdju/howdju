import React, { Component, PropTypes } from 'react'
import { Route, IndexRoute } from 'react-router'
import { BrowserRouter as Router } from 'react-router-dom'
import DocumentTitle from 'react-document-title'
import Header from './Header'
import HomePage from './HomePage'
import StatementJustificationsPage from './StatementJustificationsPage'
import LoginPage from './LoginPage'
import './App.css'

export default class App extends Component {
  render () {
    return (
      <DocumentTitle title="Howdju">
        <Router>
          <div id="app">

            <Header/>

            <Route exact path="/" component={HomePage} />
            <Route path="/login" component={LoginPage} />
            <Route path="/s/:statementId/:statementSlug" component={StatementJustificationsPage} />

          </div>
        </Router>
      </DocumentTitle>
    )
  }
}
