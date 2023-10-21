import React, { Component, FormEvent } from "react";
import { goBack } from "connected-react-router";
import { get } from "lodash";
import { FocusContainer } from "react-md";
import { connect, ConnectedProps } from "react-redux";
import { Grid, GridCell } from "@react-md/utils";

import { Credentials, makeCredentials } from "howdju-common";

import { CircularProgress } from "@/components/progress/CircularProgress";
import { Card, CardContent, CardActions } from "@/components/card/Card";
import {
  api,
  editors,
  mapActionCreatorGroupToDispatchToProps,
  ui,
} from "./actions";
import config from "./config";
import EmailField from "./components/text/EmailTextField";
import Helmet from "./Helmet";
import PasswordField from "./components/text/PasswordField";
import { EditorTypes } from "./reducers/editors";
import { selectAuthEmail } from "./selectors";
import { RootState } from "./setupStore";
import { PropertyChanges } from "./types";
import CancelButton from "./editors/CancelButton";
import SolidButton from "./components/button/SolidButton";
import OutlineButton from "./components/button/OutlineButton";
import ErrorMessages from "./ErrorMessages";
import { makeErrorPropCreator } from "./modelErrorMessages";
import paths from "./paths";

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
      <Grid id="login-page">
        <Helmet>
          <title>Login — Howdju</title>
        </Helmet>
        <GridCell colSpan={12} clone={true}>
          <Card title="Login" subtitle={subtitle}>
            <CardContent>
              <ErrorMessages errors={this.props.editorState?.errors?._errors} />
              <form onSubmit={this.onSubmit}>
                <FocusContainer focusOnMount containFocus={false}>
                  <EmailField
                    id="email"
                    name="email"
                    value={email}
                    autoComplete="username"
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
                </FocusContainer>

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
        </GridCell>
        <GridCell colSpan={12} clone={true}>
          <Card>
            <CardContent>
              Howdju 2.0 is currently in private gamma. Enter your email to sign
              up for updates:
            </CardContent>
            <CardContent>
              <form
                action="//howdju.us16.list-manage.com/subscribe/post?u=ccf334287da1fbf7af0904629&amp;id=f08c3a775d"
                method="post"
                target="_blank"
                // https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/noopener
                {...{ rel: "noopener" }}
              >
                <EmailField id="mce-email" name="EMAIL" required />
                <input
                  type="hidden"
                  name="b_ccf334287da1fbf7af0904629_f08c3a775d"
                  tabIndex={-1}
                />
                <CardActions>
                  <SolidButton type="submit" name="subscribe">
                    Subscribe
                  </SolidButton>
                </CardActions>
              </form>
            </CardContent>
          </Card>
        </GridCell>
      </Grid>
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
