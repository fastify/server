"use strict";
const { describe, test } = require("node:test");
const dns = require("node:dns");
const { createServer } = require("../../lib");
const { withResolvers } = require("../../lib/utils");

const handler = (_request, response) => {
  response.writeHead(200, {
    "Content-Type": "application/json",
  });
  response.end(
    JSON.stringify({
      data: "Hello World!",
    }),
  );
};

describe("dns", () => {
  test("throw error", async (t) => {
    t.plan(4);

    const lookup = dns.lookup;
    const { mock } = t.mock.method(
      dns,
      "lookup",
      (hostname, options, callback) => {
        // node:http internally call dns.lookup to resolve localhost
        // we need to alter the first call only
        if (hostname === "localhost" && mock.callCount() === 1) {
          callback(new Error("Kaboom!"));
        } else {
          lookup(hostname, options, callback);
        }
      },
    );

    const { promise, resolve } = withResolvers();

    const server = createServer({}, handler);
    t.assert.strictEqual(server.listening, false);

    server.once("fastify.listening", () => {
      t.assert.strictEqual(server.listening, true);
      const addresses = server.addresses();
      t.assert.strictEqual(addresses.length, 1);
      server.close();
    });
    server.once("fastify.close", () => {
      t.assert.strictEqual(server.listening, false);
      mock.restore();
      resolve();
    });

    server.listen();

    await promise;
  });

  test("return empty record", async (t) => {
    t.plan(4);

    const lookup = dns.lookup;
    const { mock } = t.mock.method(
      dns,
      "lookup",
      (hostname, options, callback) => {
        // node:http internally call dns.lookup to resolve localhost
        // we need to alter the first call only
        if (hostname === "localhost" && mock.callCount() === 1) {
          callback(null, []);
        } else {
          lookup(hostname, options, callback);
        }
      },
    );

    const { promise, resolve } = withResolvers();

    const server = createServer({}, handler);
    t.assert.strictEqual(server.listening, false);

    server.once("fastify.listening", () => {
      t.assert.strictEqual(server.listening, true);
      const addresses = server.addresses();
      t.assert.strictEqual(addresses.length, 1);
      server.close();
    });
    server.once("fastify.close", () => {
      t.assert.strictEqual(server.listening, false);
      mock.restore();
      resolve();
    });

    server.listen();

    await promise;
  });

  test("return > 2 records", async (t) => {
    t.plan(4);

    const lookup = dns.lookup;
    const { mock } = t.mock.method(
      dns,
      "lookup",
      (hostname, options, callback) => {
        // node:http internally call dns.lookup to resolve localhost
        // we need to alter the first call only
        if (hostname === "localhost") {
          callback(null, [
            {
              address: "::1",
              family: 6,
            },
            {
              address: "127.0.0.1",
              family: 4,
            },
            {
              address: "0.0.0.0",
              family: 4,
            },
          ]);
        } else {
          lookup(hostname, options, callback);
        }
      },
    );

    const { promise, resolve } = withResolvers();

    const server = createServer({}, handler);
    t.assert.strictEqual(server.listening, false);

    server.once("fastify.listening", () => {
      t.assert.strictEqual(server.listening, true);
      const addresses = server.addresses();
      // Linux (Ubuntu) with SO_REUSEADDR off will treats
      // 0.0.0.0 and 127.0.0.1 as the same host
      // so, we check for >= 2
      t.assert.strictEqual(addresses.length >= 2, true);
      server.close();
    });
    server.once("fastify.close", () => {
      t.assert.strictEqual(server.listening, false);
      mock.restore();
      resolve();
    });

    server.listen();

    await promise;
  });
});
