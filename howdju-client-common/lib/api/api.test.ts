import Axios from "axios";
import { Api } from "./api";

jest.mock("axios", () => {
  const axios = jest.requireActual("axios");
  const request = jest.fn();
  return {
    ...axios,
    __esModule: true,
    default: {
      ...axios.default,
      create: jest.fn(() => ({ request })),
    },
  };
});
const mockedAxios = jest.mocked(Axios);
// eslint-disable-next-line @typescript-eslint/unbound-method
const mockRequest = mockedAxios.create().request as jest.MockedFunction<any>;

beforeEach(() => {
  mockRequest.mockReset();
});

describe("api", () => {
  test("request", async () => {
    const propositions = [
      { id: 1, text: "a proposition" },
      { id: 2, text: "another proposition" },
    ];
    mockRequest.mockImplementation(() =>
      Promise.resolve({
        data: propositions,
      })
    );

    const api = new Api({ apiRoot: "the-api-root" });
    const result = await api.sendRequest({
      endpoint: "blah",
      method: "GET",
      headers: {},
      body: "",
    });

    expect(result).toEqual(propositions);
  });
});
