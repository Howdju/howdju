import { ArgumentParser } from "argparse";
import read from "read";

import { logger } from "howdju-ops";
import { CreateUser, UserOut } from "howdju-common";
import {
  permissions as PERMISSIONS,
  Permission,
  AppProvider,
  AsyncConfig,
} from "howdju-service-common";

import { ApiProvider } from "../src/init";

const parser = new ArgumentParser({
  description: "Add a user",
});
parser.add_argument("--email", { required: true });
parser.add_argument("--username", { required: true });
parser.add_argument("--shortName");
parser.add_argument("--longName", { default: "testname" });
parser.add_argument("--phoneNumber");
parser.add_argument("--inactive", { action: "store_true" });
parser.add_argument("--creatorUserId");
parser.add_argument("--groups", { help: "comma-delimited list" });
parser.add_argument("--permissions", { help: "comma-delimited list" });
const args = parser.parse_args();

const appProvider = new ApiProvider(
  args.stage,
  // All config must come from env. vars.
  Promise.resolve({} as AsyncConfig)
) as unknown as AppProvider;

const {
  usersService,
  permissionsService,
  groupsService,
  databaseClientProvider,
} = appProvider;

Promise.resolve(createUser())
  .finally(() => void databaseClientProvider.close())
  .catch((err) => console.log({ err }));

async function createUser() {
  const password = await read({
    prompt: `Please enter the password for ${args.email}:`,
    silent: true,
  });
  const userParams: CreateUser = {
    email: args.email,
    username: args.username,
    doesAcceptTerms: true,
    is13YearsOrOlder: true,
    hasMajorityConsent: true,
    isNotGdpr: true,
    shortName: args.shortName,
    longName: args.longName,
    phoneNumber: args.phoneNumber,
    isActive: !args.inactive,
  };
  const createUser = CreateUser.parse(userParams);
  const user = await usersService.createUserAsUser(
    args.creatorUserId,
    createUser,
    password
  );

  logger.info("Created user", { id: user.id, email: user.email });

  await Promise.all([
    args.permissions
      ? addPermissionsToUser(user, args.permissions)
      : Promise.resolve(),
    args.groups ? addUserToGroups(user, args.groups) : Promise.resolve(),
  ]);
}

async function addPermissionsToUser(user: UserOut, permissions: string) {
  const permissionNames = permissions.split(",");
  for (const permissionName of permissionNames) {
    if (!(permissionName in PERMISSIONS)) {
      throw new Error(`Unknown permission: ${permissionName}`);
    }
  }
  await permissionsService.addPermissionsToUser(
    user,
    permissionNames as Permission[]
  );
  logger.info(`Granted user ${user.id} permissions: ${permissions}`);
}

async function addUserToGroups(user: UserOut, groups: string) {
  const groupNames = groups.split(",");
  await groupsService.addUserToGroups(user, groupNames);
  logger.info(`Added user ${user.id} to groups: ${groups}`);
}
