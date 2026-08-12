/** @typedef {import('../types/server').ServerOptions} ServerOptions */

/**
 * normalize server options
 * @param {ServerOptions} options
 * @returns {ServerOptions}
 */
function normalizeServerOptions(options) {
  const serverOptions = {};
  if (typeof options.serverFactory === "function")
    serverOptions.serverFactory = options.serverFactory;

  if (options.http === true) serverOptions.http = {};
  if (typeof options.http === "object" && options.http !== null)
    serverOptions.http = options.http;

  if (options.https === true) serverOptions.https = {};
  if (typeof options.https === "object" && options.https !== null)
    serverOptions.https = options.https;

  if (options.http2 === true) serverOptions.http2 = true;

  if (
    typeof options.keepAliveTimeout === "number" &&
    Number.isInteger(options.keepAliveTimeout)
  )
    serverOptions.keepAliveTimeout = options.keepAliveTimeout;
  else
    serverOptions.keepAliveTimeout = 72000;

  if (
    typeof options.connectionTimeout === "number" &&
    Number.isInteger(options.connectionTimeout)
  )
    serverOptions.connectionTimeout = options.connectionTimeout;
  else
    serverOptions.connectionTimeout = 0;

  if (
    typeof options.maxRequestsPerSocket === "number" &&
    Number.isInteger(options.maxRequestsPerSocket)
  )
    serverOptions.maxRequestsPerSocket = options.maxRequestsPerSocket;
  else
    serverOptions.maxRequestsPerSocket = 0;

  if (
    typeof options.requestTimeout === "number" &&
    Number.isInteger(options.requestTimeout)
  )
    serverOptions.requestTimeout = options.requestTimeout;
  else
    serverOptions.requestTimeout = 0;

  if (
    typeof options.http2SessionTimeout === "number" &&
    Number.isInteger(options.http2SessionTimeout)
  )
    serverOptions.http2SessionTimeout = options.http2SessionTimeout;
  else
    serverOptions.http2SessionTimeout = 72000;


  return serverOptions;
}

/** @typedef {import('../types/server').HTTPServerOptions} HTTPServerOptions */
/** @typedef {import('../types/server').HTTPRequestListener} HTTPRequestListener */
/** @typedef {import('../types/server').HTTPServer} HTTPServer */

/**
 *
 * @param {HTTPServerOptions} options
 * @param {HTTPRequestListener} requestListener
 * @returns {HTTPServer}
 */
function createHTTPServer(options, requestListener) {
  const http = require("node:http");

  const server = http.createServer(options.http, requestListener);

  server.keepAliveTimeout = options.keepAliveTimeout;
  server.requestTimeout = options.requestTimeout;
  server.setTimeout(options.connectionTimeout);
  if (options.maxRequestsPerSocket > 0)
    server.maxRequestsPerSocket = options.maxRequestsPerSocket;

  return server;
}

/**
 *
 * @param {ServerOptions} options
 * @returns {boolean}
 */
function isHTTPS(options) {
  return typeof options.https === "object";
}

/** @typedef {import('../types/server').HTTPSServerOptions} HTTPSServerOptions */
/** @typedef {import('../types/server').HTTPSRequestListener} HTTPSRequestListener */
/** @typedef {import('../types/server').HTTPSServer} HTTPSServer */

/**
 *
 * @param {HTTPSServerOptions} options
 * @param {HTTPSRequestListener} requestListener
 * @returns {HTTPSServer}
 */
function createHTTPSServer(options, requestListener) {
  const https = require("node:https");

  const serverOptions = options.https === true ? {} : options.https;

  const server = https.createServer(serverOptions, requestListener);

  server.keepAliveTimeout = options.keepAliveTimeout;
  server.requestTimeout = options.requestTimeout;
  server.setTimeout(options.connectionTimeout);
  if (options.maxRequestsPerSocket > 0) {
    server.maxRequestsPerSocket = options.maxRequestsPerSocket;
  }

  return server;
}

/**
 *
 * @param {ServerOptions} options
 * @returns {boolean}
 */
function isHTTP2(options) {
  return options.http2 === true;
}

/** @typedef {import('../types/server').HTTP2ServerOptions} HTTP2ServerOptions */
/** @typedef {import('../types/server').HTTP2RequestListener} HTTP2RequestListener */
/** @typedef {import('../types/server').HTTP2Server} HTTP2Server */
/** @typedef {import('../types/server').HTTP2SecureServerOptions} HTTP2SecureServerOptions */
/** @typedef {import('../types/server').HTTP2SecureRequestListener} HTTP2SecureRequestListener */
/** @typedef {import('../types/server').HTTP2SecureServer} HTTP2SecureServer */

/**
 * @overload
 * @param {HTTP2SecureServerOptions} options
 * @param {HTTP2SecureRequestListener} requestListener
 * @returns {HTTP2SecureServer}
 */

/**
 * @overload
 * @param {HTTP2ServerOptions} options
 * @param {HTTP2RequestListener} requestListener
 * @returns {HTTP2Server}
 */

/**
 *
 * @param {HTTP2ServerOptions | HTTP2SecureServerOptions} options
 * @param {HTTP2RequestListener | HTTP2SecureRequestListener} requestListener
 * @returns {HTTP2Server | HTTP2SecureServer}
 */
function createHTTP2Server(options, requestListener) {
  const http2 = require("node:http2");

  let server = null;
  if (isHTTPS(options)) {
    server = http2.createSecureServer(options.https, requestListener);
  } else {
    server = http2.createServer(options.http ?? {}, requestListener);
  }

  // update options
  server.on("session", (session) => {
    session.setTimeout(options.http2SessionTimeout, () => {
      session.close();
    });
  });

  server.setTimeout(options.connectionTimeout);

  return server;
}

/**
 *
 * @param {ServerOptions} options
 * @returns {boolean}
 */
function isCustom(options) {
  return options && typeof options.serverFactory === "function";
}

/** @typedef {import('../types/server').CustomServerOptions} CustomServerOptions */
/** @typedef {import('../types/server').RequestListener} RequestListener */
/** @typedef {import('../types/server').Server} Server */

/**
 *
 * @param {CustomServerOptions} options
 * @param {RequestListener} requestListener
 * @returns {Server}
 */
function createCustomServer(options, requestListener) {
  return options.serverFactory(requestListener, options);
}

/**
 * @overload
 * @param {HTTPServerOptions} options
 * @param {HTTPRequestListener} requestListener
 * @returns {HTTPServer}
 */

/**
 * @overload
 * @param {HTTPSServerOptions} options
 * @param {HTTPSRequestListener} requestListener
 * @returns {HTTPSServer}
 */

/**
 * @overload
 * @param {HTTP2SecureServerOptions} options
 * @param {HTTP2SecureRequestListener} requestListener
 * @returns {HTTP2SecureServer}
 */

/**
 * @overload
 * @param {HTTP2ServerOptions} options
 * @param {HTTP2RequestListener} requestListener
 * @returns {HTTP2Server}
 */

/**
 * @overload
 * @param {CustomServerOptions} options
 * @param {RequestListener} requestListener
 * @returns {Server}
 */

/**
 *
 * @param {ServerOptions} options
 * @param {RequestListener} requestListener
 * @returns {Server}
 */
function selectServer(options, requestListener) {
  const result = { type: '', server: null }

  if (isCustom(options)) {
    result.type = 'custom'
    result.server = createCustomServer(options, requestListener)
  } else if (isHTTP2(options)) {
    result.type = 'http2'
    result.server = createHTTP2Server(options, requestListener)
  } else if (isHTTPS(options)) {
    result.type = 'https'
    result.server = createHTTPSServer(options, requestListener);
  } else {
    result.type = 'http'
    result.server = createHTTPServer(options, requestListener);
  }

  return result;
}

module.exports.isHTTPS = isHTTPS;
module.exports.selectServer = selectServer;
module.exports.normalizeServerOptions = normalizeServerOptions;
