import {
  Command,
  DescribeParametersCommand,
  GetParametersCommand,
} from "@aws-sdk/client-ssm";
import { toJson } from "howdju-common";

describe("parameterStore", () => {
  describe("getParameterStoreConfig", () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
    it("should return deserialized parameters", async () => {
      // Arrange
      jest.mock("@aws-sdk/client-ssm", () => {
        const ssmClient = {
          send: jest.fn(),
        };
        return {
          GetParametersCommand: jest.requireActual("@aws-sdk/client-ssm")
            .GetParametersCommand,
          DescribeParametersCommand: jest.requireActual("@aws-sdk/client-ssm")
            .DescribeParametersCommand,
          SSMClient: jest.fn().mockImplementation(() => {
            return ssmClient;
          }),
        };
      });

      const environment = "test";
      const databaseConnectionInfoName = `/${environment}/database-connection-info`;
      const expected = {
        "database-connection-info": {
          host: "the-host",
          database: "the-db-name",
          username: "the-username",
          password: "the-password",
        },
      };
      const { SSMClient } = jest.requireMock("@aws-sdk/client-ssm");
      const ssmClient = new SSMClient();
      // We mocked the constructor always to return the same instance, so mocking this one will
      // mock the one in parameterStore.ts too.
      ssmClient.send.mockImplementation((command: Command) => {
        if (command instanceof GetParametersCommand) {
          return {
            Parameters: [
              {
                Name: databaseConnectionInfoName,
                Value: toJson(expected["database-connection-info"]),
              },
            ],
          };
        }
        if (command instanceof DescribeParametersCommand) {
          return {
            Parameters: [
              {
                Name: databaseConnectionInfoName,
                Type: "String",
              },
            ],
          };
        }
        throw new Error("Unexpected command type");
      });

      const { getParameterStoreConfig } =
        jest.requireActual("./parameterStore");

      // Act
      const result = await getParameterStoreConfig(environment);

      // Assert
      expect(result).toEqual(expected);
    });

    it("only requests extant parameters", async () => {
      // Arrange
      jest.mock("@aws-sdk/client-ssm", () => {
        const ssmClient = {
          send: jest.fn(),
        };
        return {
          GetParametersCommand: jest.requireActual("@aws-sdk/client-ssm")
            .GetParametersCommand,
          DescribeParametersCommand: jest.requireActual("@aws-sdk/client-ssm")
            .DescribeParametersCommand,
          SSMClient: jest.fn().mockImplementation(() => {
            return ssmClient;
          }),
        };
      });

      const environment = "test";
      const databaseConnectionInfoName = `/${environment}/database-connection-info`;
      const expected = {
        "database-connection-info": {
          host: "the-host",
          database: "the-db-name",
          username: "the-username",
          password: "the-password",
        },
      };
      const { SSMClient } = jest.requireMock("@aws-sdk/client-ssm");
      const ssmClient = new SSMClient();
      // We mocked the constructor always to return the same instance, so mocking this one will
      // mock the one in parameterStore.ts too.
      ssmClient.send.mockImplementation((command: Command) => {
        if (command instanceof GetParametersCommand) {
          return {
            Parameters: [
              {
                Name: databaseConnectionInfoName,
                Value: toJson(expected["database-connection-info"]),
              },
            ],
          };
        }
        if (command instanceof DescribeParametersCommand) {
          return {
            Parameters: [
              {
                Name: databaseConnectionInfoName,
                Type: "String",
              },
            ],
          };
        }
        throw new Error("Unexpected command type");
      });

      const { getParameterStoreConfig } =
        jest.requireActual("./parameterStore");

      // Act
      await getParameterStoreConfig(environment);

      // Assert
      expect(ssmClient.send).toHaveBeenCalledTimes(2);
      const getParametersCall = ssmClient.send.mock.calls.find(
        ([command]: [Command]) => command instanceof GetParametersCommand
      );
      const getParametersCommand = getParametersCall[0];
      expect(getParametersCommand.input).toMatchObject({
        Names: [databaseConnectionInfoName],
      });
    });
  });
});
