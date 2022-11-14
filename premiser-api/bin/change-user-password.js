const { ArgumentParser } = require("argparse");
const { promisify } = require("bluebird");
const read = require("read");

const { logger } = require("howdju-ops");
const { AppProvider } = require("../src/init");

const appProvider = new AppProvider();
const { usersService, pool } = appProvider;

const parser = new ArgumentParser({
  description: "Change a user password",
});
parser.add_argument("--email", { required: true });
const args = parser.parse_args();

promisify(read)({
  prompt: `Please enter the new password for ${args.email}:`,
  silent: true,
})
  .then((password) => usersService.updatePasswordForEmail(args.email, password))
  .finally(() => pool.end())
  .catch((err) => logger.error({ err }));
