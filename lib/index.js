const { selectServer, normalizeServerOptions } = require("./server");
const { listenLookupHosts, normalizeListenOptions } = require("./listen");
const { normalizeCallback, listeningOrigin, stateClose, syncInternalServers } = require("./utils");
const { kState, kRaw, kInternalServers } = require("./symbols");
const { ERR_SERVER_ALREADY_LISTEN } = require("./errors");

/** @typedef {import('../types/server').ServerOptions} ServerOptions */
/** @typedef {import('../types/server').HTTPServerOptions} HTTPServerOptions */
/** @typedef {import('../types/server').HTTPSServerOptions} HTTPSServerOptions */
/** @typedef {import('../types/server').HTTP2ServerOptions} HTTP2ServerOptions */
/** @typedef {import('../types/server').HTTP2SecureServerOptions} HTTP2SecureServerOptions */
/** @typedef {import('../types/server').CustomServerOptions} CustomServerOptions */
/** @typedef {import('../types/server').RequestListener} RequestListener */
/** @typedef {import('../types/server').HTTPRequestListener} HTTPRequestListener */
/** @typedef {import('../types/server').HTTPSRequestListener} HTTPSRequestListener */
/** @typedef {import('../types/server').HTTP2RequestListener} HTTP2RequestListener */
/** @typedef {import('../types/server').HTTP2SecureRequestListener} HTTP2SecureRequestListener */
/** @typedef {import('../types/index').ProxyServer} ProxyServer */
/** @typedef {import('../types/server').ProxyHTTPServer} ProxyHTTPServer */
/** @typedef {import('../types/server').ProxyHTTPSServer} ProxyHTTPSServer */
/** @typedef {import('../types/server').ProxyHTTP2Server} ProxyHTTP2Server */
/** @typedef {import('../types/server').ProxyHTTP2SecureServer} ProxyHTTP2SecureServer */

/**
 * @overload
 * @param {HTTPServerOptions} options
 * @param {HTTPRequestListener} requestListener
 * @returns {ProxyHTTPServer}
 */

/**
 * @overload
 * @param {HTTPSServerOptions} options
 * @param {HTTPSRequestListener} requestListener
 * @returns {ProxyHTTPSServer}
 */

/**
 * @overload
 * @param {HTTP2SecureServerOptions} options
 * @param {HTTP2SecureRequestListener} requestListener
 * @returns {ProxyHTTP2SecureServer}
 */

/**
 * @overload
 * @param {HTTP2ServerOptions} options
 * @param {HTTP2RequestListener} requestListener
 * @returns {ProxyHTTP2Server}
 */

/**
 * @overload
 * @param {CustomServerOptions} options
 * @param {RequestListener} requestListener
 * @returns {ProxyServer}
 */

/**
 *
 * @param {ServerOptions} options
 * @param {RequestListener} requestListener
 * @returns {ProxyServer}
 */
function createServer(options, requestListener) {
  const internalServers = [];
  const serverOptions = normalizeServerOptions(options);
  const { type, server } = selectServer(serverOptions, requestListener);
  const state = {
    listen: false,
    listening: false,
    closed: false,
    closing: false,
    error: false,
    aborted: false,
  };

  // when there are internal servers
  // proxy to sync between differece servers
  const proxy = new Proxy(server, {
    get(target, name, receiver) {
      if (name === kRaw) return server;
      if (name === kState) return state;
      if (name === kInternalServers) return internalServers;
      if (name === "listen") return listen;
      if (name === "close") return close;
      if (name === "addresses") return addresses;
      if (name === "listeningOrigin") return listeningOrigin(server, serverOptions);
      return Reflect.get(target, name, receiver);
    },
    set(target, name, value, receiver) {
      syncInternalServers(type, internalServers, name, value)
      // always passthrough in last
      return Reflect.set(target, name, value, receiver);
    },
  });

  function listen(listenOptions = {}, callback) {
    const cb = normalizeCallback(callback);
    if (state.listen) {
      cb(new ERR_SERVER_ALREADY_LISTEN());
      return cb.promise;
    }

    const normalizedListenOptions = normalizeListenOptions(listenOptions);
    // exit early when aborted
    if (normalizedListenOptions.signal) {
      if (normalizedListenOptions.signal.aborted) return;
      state.aborted = normalizedListenOptions.signal.aborted;
      normalizedListenOptions.signal.addEventListener(
        "abort",
        () => {
          state.aborted = true;
          close();
        },
        { once: true },
      );
    }

    listenLookupHosts(
      proxy,
      requestListener,
      serverOptions,
      normalizedListenOptions,
      (error) => {
        if (error) {
          state.listen = false;
          cb(error);
        } else {
          state.listening = true;
          state.closed = false;
          // we do not override the server original event
          // instead using custom prefix event to signal when all server is listening
          server.emit("fastify.listening");
          cb(null, server.address());
        }
      },
    );

    return cb.promise;
  }

  function close(callback) {
    if (state.closed || state.closing) return;

    const cb = normalizeCallback(callback);

    function onClose() {
      server.off("close", onClose);
      let bound = internalServers.length;
      if (bound === 0) {
        stateClose(state, internalServers);
        server.emit("fastify.close");
        cb();
      } else {
        for (const internalServer of internalServers) {
          function internalOnClose() {
            internalServer.off("close", internalOnClose);
            bound--;
            if (bound === 0) {
              stateClose(state, internalServers);
              server.emit("fastify.close");
              cb();
            }
          }
          internalServer.on("close", internalOnClose);
        }
      }
    }

    state.closing = true;
    // delay close callback to all server closed
    server.on("close", onClose);
    // server.close will signal the internalServer through close event
    server.close();

    return cb.promise;
  }

  function addresses() {
    if (internalServers.length === 0) {
      return [server.address()];
    } else {
      const addresses = internalServers.map((server) => server.address());
      addresses.unshift(server.address());
      return addresses;
    }
  }

  return proxy;
}

module.exports.createServer = createServer;
