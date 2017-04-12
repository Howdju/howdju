import React, { Component, PropTypes } from 'react'
import { Route, IndexRoute } from 'react-router'
import { Link } from 'react-router-dom'

import { BrowserRouter as Router } from 'react-router-dom'
import DocumentTitle from 'react-document-title'
import Button from 'react-md/lib/Buttons/Button'
import Drawer from 'react-md/lib/Drawers/Drawer';
import ListItem from 'react-md/lib/Lists/ListItem'
import Snackbar from 'react-md/lib/Snackbars'
import Toolbar from 'react-md/lib/Toolbars';
import { connect } from 'react-redux'

import './App.scss'
import Header from './Header'
import HomePage from './HomePage'
import StatementJustificationsPage from './StatementJustificationsPage'
import LoginPage from './LoginPage'
import {dismissToast, hideNavDrawer, logout, setNavDrawerVisibility} from "./actions";

class App extends Component {

  constructor() {
    super()
    this.handleLogout = this.handleLogout.bind(this)
    this.handleHideNavDrawer = this.handleHideNavDrawer.bind(this)
    this.onNavDrawerVisibilityToggle = this.onNavDrawerVisibilityToggle.bind(this)
    this.onSnackbarDismiss = this.onSnackbarDismiss.bind(this)
  }

  handleLogout() {
    this.props.logout()
  }

  handleHideNavDrawer() {
    this.props.hideNavDrawer()
  }

  onNavDrawerVisibilityToggle(visible) {
    this.props.setNavDrawerVisibility({visible})
  }

  onSnackbarDismiss() {
    this.props.dismissToast()
  }

  render () {
    const navDrawer = (
        <Drawer
            position="right"
            type={Drawer.DrawerTypes.TEMPORARY}
            header={
              <Toolbar
                  nav={<Button icon onClick={this.handleHideNavDrawer}>close</Button>}
                  className="md-divider-border md-divider-border--bottom"
              >
                {this.props.authenticationToken &&
                <div>
                  <div>You are logged in as {this.props.authenticatedEmail}</div>
                  <Button raised label="Logout" onClick={this.handleLogout} />
                </div>
                }
              </Toolbar>
            }
            navItems={[
              <ListItem key="login" primaryText="Login" component={Link} to="/login" />
            ]}
            visible={this.props.isNavDrawerVisible}
            onVisibilityToggle={this.onNavDrawerVisibilityToggle}
            style={{ zIndex: 100 }}
        />)
    return (
      <DocumentTitle title="Howdju">
        <Router>
          <div id="app">

            <Header/>

            {navDrawer}

            <div id="page" className="md-toolbar-relative">

              <Route exact path="/" component={HomePage} />
              <Route path="/login" component={LoginPage} />
              <Route path="/s/:statementId/:statementSlug" component={StatementJustificationsPage} />

            </div>

            <Snackbar toasts={this.props.toasts} onDismiss={this.onSnackbarDismiss} />

          </div>
        </Router>
      </DocumentTitle>
    )
  }
}

const mapStateToProps = state => {
  const {
    auth: {
      email: authenticatedEmail,
      authenticationToken,
    },
    ui: {
      app: {
        isNavDrawerVisible,
        toasts,
      }
    }
  } = state
  return {
    authenticatedEmail,
    authenticationToken,
    isNavDrawerVisible,
    toasts,
  }
}

export default connect(mapStateToProps, {
  logout,
  hideNavDrawer,
  setNavDrawerVisibility,
  dismissToast,
})(App)