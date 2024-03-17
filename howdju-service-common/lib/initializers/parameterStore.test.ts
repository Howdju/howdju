describe("parameterStore", () => {
  describe("getParameterStoreConfig", () => {
    it("should return deserialized parameters", async () => {
      // Arrange
      jest.mock("@aws-sdk/client-ssm", () => {
        const ssmClient = {
          send: jest.fn(),
        };
        return {
          GetParametersCommand: jest.requireActual("@aws-sdk/client-ssm")
            .GetParametersCommand,
          SSMClient: jest.fn().mockImplementation(() => {
            return ssmClient;
          }),
        };
      });

      const environment = "test";
      const expected = {
        DATABASE_CONNECTION_INFO: {
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
      ssmClient.send.mockResolvedValue({
        Parameters: [
          {
            Name: "/test/DATABASE_CONNECTION_INFO",
            Value: JSON.stringify(expected.DATABASE_CONNECTION_INFO),
          },
        ],
      });

      const { getParameterStoreConfig } =
        jest.requireActual("./parameterStore");

      // Act
      const result = await getParameterStoreConfig(environment);

      // Assert
      expect(result).toEqual(expected);
    });
  });
});
