const { createError } = require("@fastify/error");

/** @type {import('../types/errors.d.ts').ERR_SERVER_ALREADY_LISTEN} */
const ERR_SERVER_ALREADY_LISTEN = createError(
  "ERR_SERVER_ALREADY_LISTEN",
  "Listen method has been called more than once without closing.",
);

module.exports = {
  ERR_SERVER_ALREADY_LISTEN,
};
