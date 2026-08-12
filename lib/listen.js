const { selectServer } = require("./server");
const { kRaw, kInternalServers, kState } = require("./symbols");
const { withResolvers } = require("./utils");

/** @typedef {import('../types/listen').ListenOptions} ListenOptions */

/**
 * Normalize listen options to be compatible with Node.js server.listen() method.
 * @param {ListenOptions} options - The options object to normalize.
 * @returns {ListenOptions} - The normalized listen options.
 */
function normalizeListenOptions(options = {}) {
  const listenOptions = {};
  if (typeof options.handle === "object" && options.handle !== null) {
    // handle take highest proirity
    listenOptions.handle = options.handle;
  } else if (typeof options.port === "number") {
    // port take precedence over unix-socket
    listenOptions.port = options.port;
    listenOptions.host = options.host ?? "localhost";
  } else if (typeof options.path === 'string') {
    // path is the lowest proirity
    listenOptions.path = options.path;
  } else {
    // fallback to port/host when all option is not specified
    listenOptions.port = options.port ?? 0;
    listenOptions.host = options.host ?? 'localhost'
  }

  // copy other options
  // e.g. exclusive, readableAll, writableAll, ipv6Only, signal
  if (typeof options.backlog === "number")
    listenOptions.backlog = options.backlog;
  if (typeof options.exclusive === "boolean")
    listenOptions.exclusive = options.exclusive;
  if (typeof options.ipv6Only === "boolean")
    listenOptions.ipv6Only = options.ipv6Only;
  if (typeof options.reusePort === "boolean")
    listenOptions.reusePort = options.reusePort;
  if (typeof options.readableAll === "boolean")
    listenOptions.readableAll = options.readableAll;
  if (typeof options.writableAll === "boolean")
    listenOptions.writableAll = options.writableAll;
  if (
    options.signal !== null &&
    typeof options.signal === "object" &&
    typeof options.signal.addEventListener === "function"
  ) {
    listenOptions.signal = options.signal;
  }

  return listenOptions;
}

/** @typedef {import('../types/listen').LookupHostsCallback} LookupHostsCallback */
/** @typedef {import("../types/index").ServerState} ServerState */

/**
 * Lookup the host addresses for the given listen options.
 * @param {ListenOptions} listenOptions
 * @param {ServerState} state
 * @param {LookupHostsCallback} callback
 * @returns {void}
 */
function lookupHosts(listenOptions, state, callback) {
  // https://github.com/nodejs/node/issues/9390
  // If listening to 'localhost', listen to both 127.0.0.1 or ::1 if they are available.
  // If listening to 127.0.0.1, only listen to 127.0.0.1.
  // If listening to ::1, only listen to ::1.
  if (!listenOptions.host || listenOptions.host !== "localhost") {
    return callback([]);
  } else {
    const dns = require("node:dns");
    dns.lookup(listenOptions.host, { all: true }, (err, addresses) => {
      if (err || state.aborted) {
        // dns lookup failure should not affect the server listen
        return callback([]);
      }
      callback(addresses);
    });
  }
}

/** @typedef {import('../types/listen').ListenLookupHostsCallback} ListenLookupHostsCallback */
/** @typedef {import('../types/index').ProxyServer} ProxyServer */
/** @typedef {import('../types/server').Server} Server */
/** @typedef {import('../types/server').RequestListener} RequestListener */
/** @typedef {import('../types/server').ServerOptions} ServerOptions */

/**
 * Lookup the host and listen
 * @param {ProxyServer} proxy
 * @param {RequestListener} requestHandler
 * @param {ServerOptions} serverOptions
 * @param {ListenOptions} listenOptions
 * @param {ListenLookupHostsCallback} callback
 */
function listenLookupHosts(
  proxy,
  requestHandler,
  serverOptions,
  listenOptions,
  callback,
) {
  server = proxy[kRaw];
  state = proxy[kState];
  const servers = proxy[kInternalServers];

  if (!state.aborted) {
    // signal.abort() will call server.close() implicitly
    // and fire "close" event
    // we need to remove the signal to prevent double fires
    listenOptions.signal = undefined;
    server.on("listening", onListening);
    server.listen(listenOptions);
    // state.listen = true when actually call server.listen
    state.listen = true;
    state.closed = false;
  }

  // use event listeners to handle callback
  function cleanup() {
    server.off("error", onError);
    server.off("listening", onListening);
  }
  function onError(error) {
    cleanup();
    callback(error);
  }
  server.on("error", onError);
  function onListening() {
    cleanup();
    const mainAddress = server.address();
    const onUpgrade = server.emit.bind(server, "upgrade");
    lookupHosts(listenOptions, state, (addresses) => {
      const promises = [];

      for (const address of addresses) {
        // skip when the address is the same as the main address
        if (address.address === mainAddress.address) continue;

        const { promise, resolve, reject } = withResolvers();
        promises.push(promise);

        const newListenOptions = {
          ...listenOptions,
          host: address.address,
          port: mainAddress.port,
        };

        const { server: newServer } = selectServer(serverOptions, requestHandler);

        newServer.on("error", onError);
        newServer.on("listening", onListening);

        if (state.closing || state.closed || state.aborted) {
          // promise will delay the child server listen to next event cycle
          // we need to check if there are error or close on main server
          // before listening
          resolve();
        } else {
          newServer.listen(newListenOptions);
        }

        function closeServer() {
          newServer.off("upgrade", onUpgrade);
          newServer.off("close", closeServer);
          server.off("error", closeServer);
          newServer.close();
        }

        function cleanup() {
          newServer.off("error", onError);
          newServer.off("listening", onListening);
        }

        function onError(error) {
          // secondary server listen failure should not affect the main server listen
          cleanup();
          reject(error);
        }

        function onListening() {
          cleanup();
          newServer.on("upgrade", onUpgrade);
          server.on("close", closeServer);
          server.on("error", closeServer);
          servers.push(newServer);
          resolve();
        }
      }

      // use promise to parrallel wait internal server listen
      // then unwrap promise when done
      Promise.allSettled(promises).then(() => callback(null), callback);
    });
  }
}

module.exports = {
  listenLookupHosts,
  normalizeListenOptions,
};
