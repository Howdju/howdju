import React, { Component } from 'react'
import { Route, IndexRoute } from 'react-router'
import { Link } from 'react-router-dom'

import { ConnectedRouter } from 'react-router-redux'
import DocumentTitle from 'react-document-title'
import Button from 'react-md/lib/Buttons/Button'
import Drawer from 'react-md/lib/Drawers/Drawer';
import ListItem from 'react-md/lib/Lists/ListItem'
import FontIcon from 'react-md/lib/FontIcons'
import Snackbar from 'react-md/lib/Snackbars'
import Toolbar from 'react-md/lib/Toolbars';
import { connect } from 'react-redux'

import './fonts.scss'
import './App.scss'

import Header from './Header'
import HomePage from './HomePage'
import MainSearchPage from './MainSearchPage'
import ToolsPage from './ToolsPage'
import StatementJustificationsPage from './StatementJustificationsPage'
import LoginPage from './LoginPage'
import {
  api,
  app,
  mapActionCreatorGroupToDispatchToProps,
  ui,
} from "./actions";
import {history} from './configureStore'
import paths, {createJustificationPath, mainSearchPathName} from "./paths";
import mainSearcher from './mainSearcher'
import IconPage from './IconPage'
import EditStatementJustificationPage, {EditStatementJustificationPageMode} from "./EditStatementJustificationPage";

class App extends Component {

  constructor() {
    super()
    this.handleLogout = this.handleLogout.bind(this)
    this.handleHideNavDrawer = this.handleHideNavDrawer.bind(this)
    this.onNavDrawerVisibilityChange = this.onNavDrawerVisibilityChange.bind(this)
    this.onSnackbarDismiss = this.onSnackbarDismiss.bind(this)
  }

  componentDidMount() {
    this.checkInitializeMainSearch()
  }

  checkInitializeMainSearch() {
    const location = window.location
    if (location.pathname === mainSearchPathName) {
      const queryParamSearchText = mainSearcher.mainSearchText(location)
      if (queryParamSearchText) {
        this.props.app.initializeMainSearch(queryParamSearchText)
      }
    }
  }

  handleLogout() {
    this.props.api.logout()
  }

  handleHideNavDrawer() {
    this.props.ui.hideNavDrawer()
  }

  onNavDrawerVisibilityChange(visible) {
    this.props.ui.setNavDrawerVisibility({visible})
  }

  onSnackbarDismiss() {
    this.props.ui.dismissToast()
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
                  <ListItem key="logout"
                            primaryText="Logout"
                            leftIcon={<FontIcon>exit_to_app</FontIcon>}
                            onClick={this.handleLogout}
                  /> :
                  <ListItem key="login"
                            primaryText="Login"
                            leftIcon={<FontIcon>https</FontIcon>}
                            component={Link}
                            to="/login"
                  />,
              <ListItem key="createStatement"
                        primaryText="Make a Statement"
                        leftIcon={<FontIcon>add</FontIcon>}
                        component={Link}
                        to="/create-statement"
              />,
              <ListItem key="tools"
                        primaryText="Tools"
                        leftIcon={<FontIcon>build</FontIcon>}
                        component={Link}
                        to="/tools"
              />,
            ]}
            visible={this.props.isNavDrawerVisible}
            onVisibilityChange={this.onNavDrawerVisibilityChange}
            style={{ zIndex: 100 }}
        />)

    const renderHomePath = props => {
      const mainSearchText = mainSearcher.mainSearchText(props.location)
      return mainSearchText ?
          <MainSearchPage {...props} /> :
          <HomePage {...props} />
    }

    return (
      <DocumentTitle title="Howdju">
        <ConnectedRouter history={history}>
          <div id="app">

            <Header />

            {navDrawer}

            <div id="page" className="md-toolbar-relative">

              <Route exact path={paths.home()} render={renderHomePath}/>
              <Route exact path={paths.login()} component={LoginPage} />

              <Route exact path="/s/:statementId/:statementSlug?" component={StatementJustificationsPage} />

              <Route exact path="/create-statement" render={props => (
                  <EditStatementJustificationPage {...props} mode={EditStatementJustificationPageMode.CREATE_STATEMENT} />
              )} />
              <Route exact path={createJustificationPath} render={props => (
                  <EditStatementJustificationPage {...props} mode={EditStatementJustificationPageMode.CREATE_JUSTIFICATION} />
              )} />
              <Route exact path="/submit" render={props => (
                  <EditStatementJustificationPage {...props} mode={EditStatementJustificationPageMode.SUBMIT_JUSTIFICATION} />
              )} />

              <Route exact path="/tools" component={ToolsPage} />
              <Route exact path="/icons" component={IconPage} />

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

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  api,
  app,
  ui,
}))(App)