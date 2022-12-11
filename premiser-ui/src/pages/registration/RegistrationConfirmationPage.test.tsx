import React from "react";
import { rest } from "msw";
import { screen } from "@testing-library/react";
import { setupServer } from "msw/node";
import userEvent from "@testing-library/user-event";

import RegistrationConfirmationPage from "./RegistrationConfirmationPage";
import { renderWithProviders } from "@/testUtils";
import {
  apiErrorCodes,
  EntityErrorCodes,
  httpStatusCodes,
} from "howdju-common";

const handlers = [
  rest.get("http://localhost/registration-requests", (_req, res, ctx) => {
    return res(ctx.status(httpStatusCodes.ERROR));
  }),
];
const server = setupServer(...handlers);

// jest.setTimeout(5 * 60 * 1000)

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  // Use fake timers so that we can ensure animations complete before snapshotting.
  jest.useFakeTimers();
});
afterAll(() => server.close());

describe("RegistrationConfirmationPage", () => {
  test("shows form", async () => {
    // Arrange
    const registrationCode = "fake-registration-code";
    const email = "the-email@domain.com";
    server.use(
      rest.get("http://localhost/registration-requests", (_req, res, ctx) => {
        return res(ctx.status(httpStatusCodes.OK), ctx.json({ email }));
      })
    );

    // Act
    const { container, history } = renderWithProviders(
      <RegistrationConfirmationPage />
    );
    history.push(`complete-registration?registrationCode=${registrationCode}`);
    await screen.findByLabelText(/username/i);

    // Assert
    expect(screen.getByRole("heading")).toHaveTextContent(
      /complete registration/i
    );
    expect(screen.getByRole("button", { name: /register/i })).toBeDisabled();
    expect(container).toMatchSnapshot();
  });
  test("shows error message for missing registration code", async () => {
    server.use(
      rest.get("http://localhost/registration-requests", (_req, res, ctx) => {
        return res(ctx.status(httpStatusCodes.NOT_FOUND));
      })
    );

    const { container } = renderWithProviders(<RegistrationConfirmationPage />);
    await screen.findByRole("heading");

    expect(screen.getByText(/missing registration code/i)).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });
  test("shows error message for duplicate username", async () => {
    // Arrange

    // userEvent delays between actions, so make sure it advances the fake timers.
    // (https://github.com/testing-library/user-event/issues/833#issuecomment-1171452841)
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    const username = "the_username";

    server.use(
      rest.post("http://localhost/registrations", (_req, res, ctx) => {
        return res(
          ctx.status(httpStatusCodes.CONFLICT),
          ctx.json({
            errorCode: apiErrorCodes.ENTITY_CONFLICT,
            errors: {
              registrationConfirmation: {
                hasErrors: true,
                fieldErrors: {
                  username: [
                    {
                      code: EntityErrorCodes.USERNAME_TAKEN,
                      value: username,
                    },
                  ],
                },
              },
            },
          })
        );
      })
    );

    const { container, history } = renderWithProviders(
      <RegistrationConfirmationPage />
    );
    history.push(`complete-registration?registrationCode=abc`);
    await screen.findByLabelText(/username/i);

    await user.type(screen.getByLabelText(/username/i), username);
    await user.type(screen.getByLabelText(/password/i), "password");
    await user.type(screen.getByLabelText(/full name/i), "Testius Maximus IV");
    await user.type(screen.getByLabelText(/first name/i), "Testy");
    await user.click(
      screen.getByRole("checkbox", {
        name: /read and agree to the User Agreement/i,
      })
    );
    await user.click(
      screen.getByRole("checkbox", { name: /13 years old or older/i })
    );
    await user.click(
      screen.getByRole("checkbox", {
        name: /consent to the processing of my personal data/i,
      })
    );
    await user.click(
      screen.getByRole("checkbox", {
        name: /I am not located in the European Union/i,
      })
    );
    expect(screen.getByRole("button", { name: /register/i })).toBeEnabled();

    // Act
    await user.click(screen.getByRole("button", { name: /register/i }));

    // Assert
    expect(
      await screen.findByText(/That username is already registered/i)
    ).toBeInTheDocument();
    // Let all animations complete before taking the snapshot. Otherwise we get flaky UI
    // differences depending on where the material UI animations are at.
    jest.runAllTimers();
    expect(container).toMatchSnapshot();
  });
  test("shows success message upon confirmation.", async () => {
    // Arrange

    // userEvent delays between actions, so make sure it advances the fake timers.
    // (https://github.com/testing-library/user-event/issues/833#issuecomment-1171452841)
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    const username = "the_username";

    server.use(
      rest.post("http://localhost/registrations", (_req, res, ctx) => {
        return res(ctx.status(httpStatusCodes.OK));
      })
    );

    const { container, history } = renderWithProviders(
      <RegistrationConfirmationPage />
    );
    history.push(`complete-registration?registrationCode=abc`);
    await screen.findByLabelText(/username/i);

    await user.type(screen.getByLabelText(/username/i), username);
    await user.type(screen.getByLabelText(/password/i), "password");
    await user.type(screen.getByLabelText(/full name/i), "Testius Maximus IV");
    await user.type(screen.getByLabelText(/first name/i), "Testy");
    await user.click(
      screen.getByRole("checkbox", {
        name: /read and agree to the User Agreement/i,
      })
    );
    await user.click(
      screen.getByRole("checkbox", { name: /13 years old or older/i })
    );
    await user.click(
      screen.getByRole("checkbox", {
        name: /consent to the processing of my personal data/i,
      })
    );
    await user.click(
      screen.getByRole("checkbox", {
        name: /I am not located in the European Union/i,
      })
    );
    expect(screen.getByRole("button", { name: /register/i })).toBeEnabled();

    // Act
    await user.click(screen.getByRole("button", { name: /register/i }));

    // Assert
    expect(
      await screen.findByText(/You are now logged in/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        /Please enter the following to complete your registration/i
      )
    ).not.toBeInTheDocument();
    // Let all animations complete before taking the snapshot. Otherwise we get flaky UI
    // differences depending on where the material UI animations are at.
    jest.runAllTimers();
    expect(container).toMatchSnapshot();
  });
});
