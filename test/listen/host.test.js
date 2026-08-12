"use strict";
const { describe, test } = require("node:test");
const { createServer } = require("../../lib");
const { withResolvers } = require("../../lib/utils");

const handler = (_request, response) => {
  response.writeHead(200, { "Content-Type": "application/json" });
  response.end(JSON.stringify({ data: "Hello World!" }));
};

describe("host/port", () => {
  test(".listen()", async (t) => {
    t.plan(4);
    const { promise, resolve } = withResolvers();

    const server = createServer({}, handler);
    t.assert.strictEqual(server.listening, false);

    server.once("fastify.listening", () => {
      t.assert.strictEqual(server.listening, true);
      const addresses = server.addresses();
      t.assert.strictEqual(addresses.length, 2);
      server.close();
    });
    server.once("fastify.close", () => {
      t.assert.strictEqual(server.listening, false);
      resolve();
    });

    server.listen();

    await promise;
  });

  test(".listen(undefined)", async (t) => {
    t.plan(4);
    const { promise, resolve } = withResolvers();

    const server = createServer({}, handler);
    t.assert.strictEqual(server.listening, false);

    server.once("fastify.listening", () => {
      t.assert.strictEqual(server.listening, true);
      const addresses = server.addresses();
      t.assert.strictEqual(addresses.length, 2);
      server.close();
    });
    server.once("fastify.close", () => {
      t.assert.strictEqual(server.listening, false);
      resolve();
    });

    server.listen(undefined);

    await promise;
  });

  test(".listen(null)", async (t) => {
    t.plan(4);
    const { promise, resolve } = withResolvers();

    const server = createServer({}, handler);
    t.assert.strictEqual(server.listening, false);

    server.once("fastify.listening", () => {
      t.assert.strictEqual(server.listening, true);
      const addresses = server.addresses();
      t.assert.strictEqual(addresses.length, 2);
      server.close();
    });
    server.once("fastify.close", () => {
      t.assert.strictEqual(server.listening, false);
      resolve();
    });

    server.listen(undefined);

    await promise;
  });

  test(".listen({ host: '::1' })", async (t) => {
    t.plan(4);
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
      resolve();
    });

    server.listen({ host: "::1" });

    await promise;
  });

  test(".listen({ host: '127.0.0.1' })", async (t) => {
    t.plan(4);
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
      resolve();
    });

    server.listen({ host: "127.0.0.1" });

    await promise;
  });

  test(".listen({ host: null })", async (t) => {
    t.plan(4);
    const { promise, resolve } = withResolvers();

    const server = createServer({}, handler);
    t.assert.strictEqual(server.listening, false);

    server.once("fastify.listening", () => {
      t.assert.strictEqual(server.listening, true);
      const addresses = server.addresses();
      t.assert.strictEqual(addresses.length, 2);
      server.close();
    });
    server.once("fastify.close", () => {
      t.assert.strictEqual(server.listening, false);
      resolve();
    });

    server.listen({ host: null });

    await promise;
  });

  test(".listen({ host: undefined })", async (t) => {
    t.plan(4);
    const { promise, resolve } = withResolvers();

    const server = createServer({}, handler);
    t.assert.strictEqual(server.listening, false);

    server.once("fastify.listening", () => {
      t.assert.strictEqual(server.listening, true);
      const addresses = server.addresses();
      t.assert.strictEqual(addresses.length, 2);
      server.close();
    });
    server.once("fastify.close", () => {
      t.assert.strictEqual(server.listening, false);
      resolve();
    });

    server.listen({ host: undefined });

    await promise;
  });

  test(".listen({ ... })", async (t) => {
    t.plan(5);
    const { promise, resolve } = withResolvers();

    const server = createServer({}, handler);
    t.assert.strictEqual(server.listening, false);

    server.once("fastify.close", () => {
      t.assert.strictEqual(server.listening, false);
      resolve();
    });

    server.listen(
      {
        port: 0,
        host: "localhost",
        backlog: 511,
        exclusive: false,
        readableAll: false,
        writableAll: false,
        ipv6Only: false,
      },
      (error) => {
        t.assert.ifError(error);
        t.assert.strictEqual(server.listening, true);
        const addresses = server.addresses();
        t.assert.strictEqual(addresses.length, 2);
        server.close();
      },
    );

    await promise;
  });

  test(".listen({}, callback)", async (t) => {
    t.plan(5);
    const { promise, resolve } = withResolvers();

    const server = createServer({}, handler);
    t.assert.strictEqual(server.listening, false);

    server.once("fastify.close", () => {
      t.assert.strictEqual(server.listening, false);
      resolve();
    });

    server.listen({}, (error) => {
      t.assert.ifError(error);
      t.assert.strictEqual(server.listening, true);
      const addresses = server.addresses();
      t.assert.strictEqual(addresses.length, 2);
      server.close();
    });

    await promise;
  });
});
