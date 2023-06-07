import os from "os";
import forEach from "lodash/forEach";
import isIpPrivate from "private-ip";
import Debug from "debug";

const debug = Debug("howdju-ops:addressUtils");

const emptyMac = "00:00:00:00:00:00";
const localhostAddress = "localhost";

export function devWebServerPort() {
  return process.env["DEV_WEB_SERVER_PORT"] || 3000;
}

export function devApiServerPort() {
  return process.env["DEV_API_SERVER_PORT"] || 8082;
}

export function getApiHost() {
  const envHost = process.env["API_HOST"];
  if (envHost) {
    return envHost;
  }
  return doEnableLocalNetworkAccess() ? localAddress() : "localhost";
}

export function getApiRoot() {
  return `http://${getApiHost()}:${devApiServerPort()}/api/`;
}

export function getUiHost() {
  const envHost = process.env["UI_HOST"];
  if (envHost) {
    return envHost;
  }
  return doEnableLocalNetworkAccess() ? localAddress() : "localhost";
}

export function doEnableLocalNetworkAccess() {
  // Whether the dev server should be accessible from other devices on the local network.
  return !!process.env.ENABLE_LOCAL_NETWORK_ACCESS;
}

function isDhcpUnreachableAddress(address: string) {
  return address.startsWith("169.254.");
}

function localAddress() {
  const addresses: string[] = [];

  forEach(os.networkInterfaces(), (infos, _name) => {
    forEach(infos, (info) => {
      if (info.internal || info.mac === emptyMac) {
        return;
      }
      if (
        !isIpPrivate(info.address) ||
        isDhcpUnreachableAddress(info.address)
      ) {
        return;
      }
      if (info.family === "IPv4") {
        // Prefer IPv4 since they're easier to type
        addresses.unshift(info.address);
      } else {
        addresses.push(info.address);
      }
    });
  });
  if (addresses.length === 0) {
    debug(`Unable to retrieve local hostname`);
    return localhostAddress;
  }
  if (addresses.length > 1) {
    debug(
      `Multiple local addresses found, using the first one: ${addresses.join(
        ", "
      )}`
    );
  }
  return addresses[0];
}
