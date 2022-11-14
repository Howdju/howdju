import { describe, expect, test } from "@jest/globals";
import {
  LocationChangeAction,
  LOCATION_CHANGE,
  RouterLocation,
} from "connected-react-router";
import { LocationState, parsePath } from "history";

import { mainSearch } from "./mainSearchBoxSlice";
import paths from "../../paths";

describe("mainSearchSlice", () => {
  test("should clear the search text when navigating to a non-search page", () => {
    const initialState = { text: "non-empty" };
    const action: LocationChangeAction = {
      type: LOCATION_CHANGE,
      payload: {
        // TODO(125): remove typecast
        location: parsePath(paths.home()) as RouterLocation<LocationState>,
        isFirstRendering: true,
        action: "PUSH",
      },
    };
    const newState = mainSearch(initialState, action);
    expect(newState.text).toBe("");
  });

  test("should not clear the search when navigating to the search page", () => {
    const text = "non-empty";
    const initialState = { text };
    const action: LocationChangeAction = {
      type: LOCATION_CHANGE,
      payload: {
        // TODO(125): remove typecast
        location: parsePath(
          paths.mainSearch(text)
        ) as RouterLocation<LocationState>,
        isFirstRendering: true,
        action: "PUSH",
      },
    };
    const newState = mainSearch(initialState, action);
    expect(newState.text).toEqual(text);
  });

  // TODO test 'should load search results on page load'

  // TODO test 'should not load search results on navigation'
});
