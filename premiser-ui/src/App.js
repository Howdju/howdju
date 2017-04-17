import React, { Component, PropTypes } from 'react'
import { Route, IndexRoute } from 'react-router'
import { Link } from 'react-router-dom'

import { ConnectedRouter } from 'react-router-redux'
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
import ToolsPage from './ToolsPage'
import StatementJustificationsPage from './StatementJustificationsPage'
import LoginPage from './LoginPage'
import {dismissToast, hideNavDrawer, logout, setNavDrawerVisibility} from "./actions";
import {history} from './configureStore'

const IconPage = props => (
    <DocumentTitle title={'Icons - Howdju'}>
      <div>
        <i className="material-icons">all_out</i>
        <i className="material-icons">open_in_new</i>
        <i className="material-icons">check_circle</i>
        <i className="material-icons">done</i>
        <i className="material-icons">loyalty</i>
        <i className="material-icons">label</i>
        <i className="material-icons">label_outline</i>
        <i className="material-icons">search</i>
        <i className="material-icons">settings</i>
        <i className="material-icons">thumb_up</i>
        <i className="material-icons">thumb_down</i>
        <i className="material-icons">add</i>
        <i className="material-icons">add_box</i>
        <i className="material-icons">add_circle</i>
        <i className="material-icons">add_circle_outline</i>
        <i className="material-icons">remove</i>
        <i className="material-icons">remove_circle</i>
        <i className="material-icons">remove_circle_outline</i>
        <i className="material-icons">archive</i>
        <i className="material-icons">unarchive</i>
        <i className="material-icons">delete</i>
        <i className="material-icons">delete_forever</i>
        <i className="material-icons">undo</i>
        <i className="material-icons">redo</i>
        <i className="material-icons">create</i>
        <i className="material-icons">block</i>
        <i className="material-icons">clear</i>
        <i className="material-icons">call_made</i>
        <i className="material-icons">compare_arrows</i>
        <i className="material-icons">merge_type</i>
      </div>
    </DocumentTitle>
)

export const paths = {
  home: '/',
  login: '/login',
}

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
            id="appNavDrawer"
            position="right"
            type={Drawer.DrawerTypes.TEMPORARY}
            header={
              <Toolbar
                  nav={<Button icon onClick={this.handleHideNavDrawer}>close</Button>}
                  className="md-divider-border md-divider-border--bottom"
              >
                {this.props.authToken &&
                  <div className="md-grid">
                    <div className="md-cell md-cell--12">
                      You are logged in as <b>{this.props.authEmail}</b>
                    </div>
                  </div>
                }
              </Toolbar>
            }
            navItems={[
              this.props.authToken ?
                  <ListItem key="logout" primaryText="Logout" onClick={this.handleLogout} /> :
                  <ListItem key="login" primaryText="Login" component={Link} to="/login" />,
              <ListItem key="tools" primaryText="Tools" component={Link} to="/tools" />
            ]}
            visible={this.props.isNavDrawerVisible}
            onVisibilityToggle={this.onNavDrawerVisibilityToggle}
            style={{ zIndex: 100 }}
        />)
    return (
      <DocumentTitle title="Howdju">
        <ConnectedRouter history={history}>
          <div id="app">

            <Header/>

            {navDrawer}

            <div id="page" className="md-toolbar-relative">

              <Route exact path={paths.home} component={HomePage} />
              <Route path={paths.login} component={LoginPage} />
              <Route path="/tools" component={ToolsPage} />
              <Route path="/icons" component={IconPage} />
              <Route path="/s/:statementId/:statementSlug" component={StatementJustificationsPage} />

            </div>

            <Snackbar toasts={this.props.toasts} onDismiss={this.onSnackbarDismiss} />

          </div>
        </ConnectedRouter>
      </DocumentTitle>
    )
  }
}

const mapStateToProps = state => {
  const {
    auth: {
      email: authEmail,
      authToken,
    },
    ui: {
      app: {
        isNavDrawerVisible,
        toasts,
      }
    }
  } = state
  return {
    authEmail,
    authToken,
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