"use strict";

const { kInternalServers, kRaw, kState } = require("./symbols");
const { stateClose } = require("./utils");

function closeAllConnections(server, force) {
  // only node:http and node:https support force close
  // node:http2 by default close idle connection and send GOAWAY when close
  if (typeof server.closeAllConnections === "function" && force === true) {
    server.closeAllConnections();
  }
}

function closeAllServers(proxy, force, callback) {
  const state = proxy[kState];
  const server = proxy[kRaw];
  const internalServers = proxy[kInternalServers];
  let bound = internalServers.length;

  function onClose() {
    server.off("close", onClose);
    if (bound === 0) {
      stateClose(state, internalServers);
      server.emit("fastify.close");
      callback();
    } else {
      for (const internalServer of internalServers) {
        function internalOnClose() {
          internalServer.off("close", internalOnClose);

          bound--;
          if (bound === 0) {
            stateClose(state, internalServers);
            server.emit("fastify.close");
            callback();
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
  // called only when force close and node:http / node:https
  // for node:http2, there is no such thing since session.close also
  // wait for the session gracefully closed
  closeAllConnections(server, force);
}

module.exports.closeAllConnections = closeAllConnections;
module.exports.closeAllServers = closeAllServers;
