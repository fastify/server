const { isHTTPS } = require("./server");

function normalizeCallback(callback) {
  if (typeof callback !== "function") {
    // promise chain should only happen on return
    // internal API should always use callback
    // to minimize the event cycle
    const { promise, resolve, reject } = withResolvers();
    function pCallback(error, data) {
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    }
    pCallback.promise = promise;
    return pCallback;
  } else {
    return callback;
  }
}

// TODO(20.x): remove when node@20 is not supported
function withResolvers() {
  let res, rej;
  const promise = new Promise((resolve, reject) => {
    res = resolve;
    rej = reject;
  });
  return { promise, resolve: res, reject: rej };
}

function listeningOrigin(server, options) {
  const address = server.address();
  if (typeof address === "string") return address;
  const host =
    address.family === "IPv6" ? `[${address.address}]` : address.address;
  return `${isHTTPS(options) ? "https" : "http"}://${host}:${address.port}`;
}

function stateClose(state, internalServers) {
  state.listen = false;
  state.listening = false;
  state.closed = true;
  state.closing = false;
  state.error = false;
  state.aborted = false;
  internalServers.length = 0;
}

const netProperties = new Set([
  'maxConnections',           // https://nodejs.org/docs/latest-v26.x/api/net.html#servermaxconnections
  'dropMaxConnection',        // https://nodejs.org/docs/latest-v26.x/api/net.html#serverdropmaxconnection
])
const httpProperties = new Set([
  ...netProperties,
  'headersTimeout',           // https://nodejs.org/docs/latest-v26.x/api/http.html#serverheaderstimeout
  'maxHeadersCount',          // https://nodejs.org/docs/latest-v26.x/api/http.html#servermaxheaderscount
  'requestTimeout',           // https://nodejs.org/docs/latest-v26.x/api/http.html#servermaxrequestspersocket
  'maxRequestsPerSocket',     // https://nodejs.org/docs/latest-v26.x/api/http.html#servermaxrequestspersocket
  'timeout',                  // https://nodejs.org/docs/latest-v26.x/api/http.html#servermaxrequestspersocket
  'keepAliveTimeout',         // https://nodejs.org/docs/latest-v26.x/api/http.html#servermaxrequestspersocket
  'keepAliveTimeoutBuffer'    // https://nodejs.org/docs/latest-v26.x/api/http.html#servermaxrequestspersocket
])
const http2Properties = new Set([
  ...netProperties,
  'timeout'                   // https://nodejs.org/docs/latest-v26.x/api/http2.html#servertimeout
])
const commonProperties = {
  http: httpProperties,
  https: httpProperties,    // https.Server extends http.Server
  http2: http2Properties,
  custom: new Set()         // do not sync for custom server
}

function syncInternalServers(type, servers, name, value) {
  const properites = commonProperties[type]
  if (properites.has(name)) {
    for (const server of servers) {
      server[name] = value
    }
  }
}

module.exports = {
  normalizeCallback,
  withResolvers,
  listeningOrigin,
  stateClose,
  syncInternalServers
};
