import { isPlainObject, isString } from "lodash";

// TODO can it generate a module?
import mainSearch from "./MainSearchGrammar";

// Generate like:
//   `yarn exec canopy lib/mainSearch/MainSearch.peg --lang js --output lib/mainSearch/MainSearchGrammar`

function processSearchElements(
  search: any,
  elements: (Element | string | undefined)[]
) {
  elements.forEach((element) => {
    if (!element) return;
    if (isString(element)) {
      search.terms.push(element);
    } else if (isPlainObject(element)) {
      Object.assign(search.facets, element);
    } else if ("elements" in element && element.elements) {
      processSearchElements(search, element.elements);
    }
  });
}

const actions = {
  makeSearch(
    _input: string,
    _start: number,
    _end: number,
    elements: Element[]
  ) {
    const search = {
      terms: [],
      facets: {},
    };
    processSearchElements(search, elements);
    return search;
  },

  makeQuotedTerm(
    _input: string,
    _start: number,
    _end: number,
    elements: Element[]
  ) {
    return elements[1].text;
  },

  makeFacetTerm(
    _input: string,
    _start: number,
    _end: number,
    elements: Element[]
  ) {
    return { [elements[0].text]: elements[2].text };
  },

  makeBareTerm(
    input: string,
    start: number,
    end: number,
    _elements: Element[]
  ) {
    return input.substring(start, end);
  },

  makeWhitespace() {
    return undefined;
  },
};

export function parseQuery(query: string) {
  return mainSearch.parse(query, { actions });
}

interface Element {
  text: string;
  elements?: Element[];
}
