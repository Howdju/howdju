import { goBack } from "connected-react-router";
import { get } from "lodash";
import React, { Component, FormEvent } from "react";
import { connect, ConnectedProps } from "react-redux";

import { Credentials, makeCredentials } from "howdju-common";

import {
  api,
  editors,
  mapActionCreatorGroupToDispatchToProps,
  ui,
} from "@/actions";
import OutlineButton from "@/components/button/OutlineButton";
import SolidButton from "@/components/button/SolidButton";
import { Card, CardActions, CardContent } from "@/components/card/Card";
import { Page } from "@/components/layout/Page";
import SingleColumnGrid from "@/components/layout/SingleColumnGrid";
import { CircularProgress } from "@/components/progress/CircularProgress";
import EmailField from "@/components/text/EmailTextField";
import PasswordField from "@/components/text/PasswordField";
import config from "@/config";
import CancelButton from "@/editors/CancelButton";
import ErrorMessages from "@/ErrorMessages";
import Helmet from "@/Helmet";
import { makeErrorPropCreator } from "@/modelErrorMessages";
import paths from "@/paths";
import { EditorTypes } from "@/reducers/editors";
import { selectAuthEmail } from "@/selectors";
import { RootState } from "@/setupStore";
import { PropertyChanges } from "@/types";

interface OwnProps {
  authEmail: string | undefined;
}

type Props = OwnProps & PropsFromRedux;

class LoginPage extends Component<Props> {
  componentDidMount() {
    const email = this.props.authEmail || "";
    this.props.editors.beginEdit(
      EditorTypes.LOGIN_CREDENTIALS,
      editorId,
      makeCredentials({ email })
    );
  }

  onPropertyChange = (properties: PropertyChanges) => {
    this.props.editors.propertyChange(
      EditorTypes.LOGIN_CREDENTIALS,
      editorId,
      properties
    );
  };

  onSubmit = (event: FormEvent<HTMLFormElement | HTMLInputElement>) => {
    event.preventDefault();
    this.props.editors.commitEdit(EditorTypes.LOGIN_CREDENTIALS, editorId);
  };

  onCancel = () => {
    this.props.goBack();
  };

  render() {
    const { editorState, isLoginRedirect } = this.props;

    const subtitle = isLoginRedirect && "Please login to continue";
    const isLoggingIn = get(editorState, "isSaving");

    const credentials = get(editorState, "editEntity");
    const email = get(credentials, "email", "");
    const password = get(credentials, "password", "");

    const errorProps = makeErrorPropCreator<Credentials>(
      this.props.editorState?.wasSubmitAttempted ?? false,
      this.props.editorState?.errors,
      this.props.editorState?.dirtyFields,
      this.props.editorState?.blurredFields
    );

    return (
      <Page id="login-page">
        <Helmet>
          <title>Login — Howdju</title>
        </Helmet>
        <SingleColumnGrid>
          <Card title="Login" subtitle={subtitle}>
            <CardContent>
              <ErrorMessages errors={this.props.editorState?.errors?._errors} />
              <form onSubmit={this.onSubmit}>
                <EmailField
                  id="email"
                  name="email"
                  value={email}
                  autoComplete="username"
                  autoFocus={true}
                  required
                  onPropertyChange={this.onPropertyChange}
                  onSubmit={this.onSubmit}
                  disabled={isLoggingIn}
                  messageProps={{
                    ...errorProps((c) => c.email),
                  }}
                />
                <PasswordField
                  id="password"
                  name="password"
                  value={password}
                  autoComplete="current-password"
                  required
                  onPropertyChange={this.onPropertyChange}
                  onSubmit={this.onSubmit}
                  disabled={isLoggingIn}
                  messageProps={{
                    ...errorProps((c) => c.password),
                  }}
                />

                <CardActions>
                  {isLoggingIn && (
                    <CircularProgress key="progress" id="progress" />
                  )}
                  <CancelButton disabled={isLoggingIn} onClick={this.onCancel}>
                    Cancel
                  </CancelButton>
                  <SolidButton type="submit" disabled={isLoggingIn}>
                    Login
                  </SolidButton>
                </CardActions>
                {config.isRegistrationEnabled && (
                  <CardActions align="start">
                    <OutlineButton href={paths.requestRegistration()}>
                      register
                    </OutlineButton>
                    <OutlineButton href={paths.requestPasswordReset()}>
                      reset password
                    </OutlineButton>
                  </CardActions>
                )}
              </form>
            </CardContent>
          </Card>
        </SingleColumnGrid>
      </Page>
    );
  }
}
const editorId = "loginPageEditorId";

const mapStateToProps = (state: RootState) => {
  const authEmail = selectAuthEmail(state);
  const editorState = state.editors["LOGIN_CREDENTIALS"]?.[editorId];
  return {
    authEmail,
    editorState,
    isLoginRedirect: !!state.app.loginRedirectLocation,
  };
};

const connector = connect(
  mapStateToProps,
  mapActionCreatorGroupToDispatchToProps(
    {
      api,
      ui,
      editors,
    },
    {
      goBack,
    }
  )
);

type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(LoginPage);
