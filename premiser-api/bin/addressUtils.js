const os = require("os");
const forEach = require("lodash/forEach");
const isIpPrivate = require("private-ip");
const { exec } = require("child_process");
const debug = require("debug")("premiser-api:addressUtils");

const emptyMac = "00:00:00:00:00:00";
const loopbackAddress = "127.0.0.1";

function isDhcpUnreachableAddress(address) {
  return address.startsWith("169.254.");
}

exports.apiHostOrHostnameAddress = (dnsLookup = true) => {
  let apiHost = process.env["API_HOST"];
  if (apiHost) {
    return apiHost;
  }
  if (dnsLookup) {
    const dnsSync = require("dns-sync");
    const dnsAddress = dnsSync.resolve(os.hostname());
    if (dnsAddress !== loopbackAddress) {
      return dnsAddress;
    }
  }
  return localAddress();
};

function localAddress() {
  const addresses = [];

  forEach(os.networkInterfaces(), (infos, name) => {
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
    return loopbackAddress;
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

// Currently unused, but potentialy useful in the future
module.exports.getLocalAddressFromIpConfig =
  function getLocalAddressFromIpConfig() {
    try {
      exec("ipconfig getifaddr en0", (error, stdout, stderr) => {
        if (error) {
          debug(`Unable to retrieve local hostname using ipconfig`, { error });
        } else if (stderr) {
          debug(`Unable to retrieve local hostname using ipconfig`, { stderr });
        } else {
          return stdout;
        }
      });
    } catch (err) {
      debug(`Unable to retrieve local hostname using ipconfig`, { err });
    }
    return undefined;
  };
