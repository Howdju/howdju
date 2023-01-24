import React from "react";
import { screen } from "@testing-library/react";

import {
  renderWithProviders,
  setupDefaultStore,
  setupUserEvent,
  withFakeTimers,
} from "@/testUtils";
import { editors } from "@/actions";
import RegistrationRequestEditor from "@/pages/registration/RegistrationRequestEditor";

withFakeTimers();

describe("withEditor", () => {
  describe("Exemplary component (RegistrationRequestEditor)", () => {
    test("submit button appears disabled when edit entity is invalid", () => {
      const editorId = "test-editor-id";

      const { preloadedState, history, store } = setupDefaultStore();
      store.dispatch(
        editors.beginEdit("REGISTRATION_REQUEST", editorId, { email: "" })
      );

      // Act
      renderWithProviders(
        <RegistrationRequestEditor
          id="test-writ-quote-editor"
          editorId={editorId}
        />,
        { preloadedState, history, store }
      );

      // Assert
      const submitButton = screen.getByRole("button", { name: /save/i });
      expect(submitButton).toHaveClass("md-btn--raised-disabled");
      expect(submitButton).toHaveClass("md-text--disabled");
    });

    test("submitting invalid entity shows errors", async () => {
      const user = setupUserEvent();
      const editorId = "test-editor-id";

      const { preloadedState, history, store } = setupDefaultStore();
      store.dispatch(
        editors.beginEdit("REGISTRATION_REQUEST", editorId, { email: "" })
      );
      const { container } = renderWithProviders(
        <RegistrationRequestEditor
          id="test-writ-quote-editor"
          editorId={editorId}
        />,
        { preloadedState, history, store }
      );

      // Act
      await user.click(screen.getByRole("button", { name: /save/i }));

      // Assert
      const titleInput = screen.getByLabelText(/email/i);
      const titleLabel = container.querySelector(`[for=${titleInput.id}]`);
      expect(titleLabel).toHaveClass("md-text--error");

      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();

      jest.runAllTimers();
      expect(container).toMatchSnapshot();
    });
  });
});