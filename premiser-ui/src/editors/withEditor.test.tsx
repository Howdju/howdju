import React from "react";
import { screen } from "@testing-library/react";

import {
  DISABLED_BUTTON_CLASS,
  renderWithProviders,
  setupDefaultStore,
  setupUserEvent,
  withFakeTimers,
} from "@/testUtils";
import { editors } from "@/actions";
import RegistrationRequestEditor from "@/pages/registration/RegistrationRequestEditor";

const REACT_MD_LABEL_ERROR_CLASS = "rmd-label--error";

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
      expect(submitButton).toHaveClass(DISABLED_BUTTON_CLASS);
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
      expect(titleLabel).toHaveClass(REACT_MD_LABEL_ERROR_CLASS);

      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();

      jest.runAllTimers();
      expect(container).toMatchSnapshot();
    });
  });
});
