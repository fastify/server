"use strict";
const kRaw = Symbol("fastify.server.raw");
const kState = Symbol("fastify.server.state");
const kInternalServers = Symbol("fastify.server.internal.servers");

module.exports = {
  kInternalServers,
  kRaw,
  kState,
};
