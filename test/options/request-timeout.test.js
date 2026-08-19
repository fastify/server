"use strict";
const http = require("node:http");
const { describe, test, before } = require("node:test");
const { once } = require("node:stream");
const { createServer } = require("../../lib");
const { kInternalServers } = require("../../lib/symbols");
const { localhostCount } = require("../utils");

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

describe("requestTimeout", () => {
  before(localhostCount);

  test("[]", (t) => {
    t.plan(1);
    const server = createServer({
      requestTimeout: [],
    });
    t.assert.strictEqual(server.requestTimeout, 0);
  });

  test("1.3", (t) => {
    t.plan(1);
    const server = createServer({
      requestTimeout: 1.3,
    });
    t.assert.strictEqual(server.requestTimeout, 0);
  });

  test("http", (t) => {
    t.plan(1);
    const server = createServer({
      http: true,
      requestTimeout: 1,
    });
    t.assert.strictEqual(server.requestTimeout, 1);
  });

  test("https", (t) => {
    t.plan(1);
    const server = createServer({
      https: true,
      requestTimeout: 2,
    });
    t.assert.strictEqual(server.requestTimeout, 2);
  });

  test("http2", (t) => {
    t.plan(1);
    const server = createServer({
      http2: true,
      requestTimeout: 3,
    });
    t.assert.notStrictEqual(server.requestTimeout, 3);
  });

  test("http2 + https", (t) => {
    t.plan(1);
    const server = createServer({
      http2: true,
      https: {},
      requestTimeout: 3,
    });
    t.assert.notStrictEqual(server.requestTimeout, 3);
  });

  test("serverFactory", (t) => {
    t.plan(1);

    function serverFactory(requestHandler) {
      const server = http.createServer((request, response) => {
        requestHandler(request, response);
      });
      server.requestTimeout = 5;
      return server;
    }

    const server = createServer({
      requestTimeout: 4,
      serverFactory,
    });
    t.assert.strictEqual(server.requestTimeout, 5);
  });

  test("update all servers", async (t) => {
    t.plan(1 + global.context.localhostCount);
    const server = createServer(
      {
        requestTimeout: 1,
      },
      handler,
    );
    t.assert.strictEqual(server.requestTimeout, 1);
    server.listen();
    await once(server, "fastify.listening");
    server.requestTimeout = 5;
    t.assert.strictEqual(server.requestTimeout, 5);
    for (const internal of server[kInternalServers]) {
      t.assert.strictEqual(internal.requestTimeout, 5);
    }
    server.close();
    await once(server, "fastify.close");
  });
});
