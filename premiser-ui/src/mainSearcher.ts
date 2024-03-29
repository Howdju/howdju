import paths from "./paths";
import { createPath, Location, LocationState } from "history";
import head from "lodash/head";

class MainSearcher {
  mainSearchText = (location: Location<LocationState>) => {
    if (
      // Return first query param if it doesn't have a value
      // Supports short-hand search like: howdju.com?politics
      location &&
      location.search
    ) {
      const queryParams = window.decodeURIComponent(
        location.search.substring(1)
      );
      const headParam = head(queryParams.split("&"));
      if (headParam && !headParam.includes("=")) {
        return headParam;
      }
    }

    return undefined;
  };
  isSearch = (location: Location<LocationState>) => {
    const searchText = this.mainSearchText(location);
    if (!searchText) {
      return false;
    }
    const searchPath = paths.mainSearch(searchText);
    const actualPath = createPath(location);
    return searchText && searchPath === actualPath;
  };
}

export default new MainSearcher();
