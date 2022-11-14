import "react-native";
import React from "react";
import App from "../src/App";

// Warning: TestRenderer must be required after react-native.
import { render, waitFor } from "@testing-library/react-native";

jest.mock("react-native", () => {
  const RN = jest.requireActual("react-native"); // use original implementation, which comes with mocks out of the box

  // mock modules/components created by assigning to NativeModules
  RN.NativeModules.ShareMenu = {
    getSharedText: jest.fn(),
    // addNewShareListener: jest.fn(),
    addListener: jest.fn(),
    removeListeners: jest.fn(),
  };

  // mock modules created through UIManager
  // RN.UIManager.getViewManagerConfig = (name: string) => {
  //   if (name === 'SomeNativeModule') {
  //     return {someMethod: jest.fn()};
  //   }
  //   return {};
  // };
  return RN;
});

describe("App", () => {
  it("renders correctly", async () => {
    const result = render(<App />);
    await waitFor(() => result.getAllByText("Browser"));
    expect(result.toJSON()).toMatchSnapshot();
  });
});
