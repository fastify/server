"use strict";
const http = require("node:http");
const { describe, test } = require("node:test");
const { once } = require("node:stream");
const { createServer } = require("../../lib");
const { kInternalServers } = require("../../lib/symbols");

const handler = (_request, response) => {
  response.writeHead(200, { "Content-Type": "application/json" });
  response.end(JSON.stringify({ data: "Hello World!" }));
};

describe("maxRequestsPerSocket", () => {
  test("[]", (t) => {
    t.plan(1);
    const server = createServer({ maxRequestsPerSocket: [] });
    t.assert.strictEqual(server.maxRequestsPerSocket, 0);
  });

  test("1.3", (t) => {
    t.plan(1);
    const server = createServer({ maxRequestsPerSocket: 1.3 });
    t.assert.strictEqual(server.maxRequestsPerSocket, 0);
  });

  test("http", (t) => {
    t.plan(1);
    const server = createServer({ maxRequestsPerSocket: 1, http: {} });
    t.assert.strictEqual(server.maxRequestsPerSocket, 1);
  });

  test("https", (t) => {
    t.plan(1);
    const server = createServer({ maxRequestsPerSocket: 2, https: {} });
    t.assert.strictEqual(server.maxRequestsPerSocket, 2);
  });

  test("http2", (t) => {
    t.plan(1);
    const server = createServer({ maxRequestsPerSocket: 3, http2: true });
    t.assert.notStrictEqual(server.maxRequestsPerSocket, 3);
  });

  test("http2 + https", (t) => {
    t.plan(1);
    const server = createServer({
      maxRequestsPerSocket: 3,
      http2: true,
      https: {},
    });
    t.assert.notStrictEqual(server.maxRequestsPerSocket, 3);
  });

  test("serverFactory", (t) => {
    t.plan(1);

    function serverFactory(requestHandler) {
      const server = http.createServer((request, response) => {
        requestHandler(request, response);
      });
      server.maxRequestsPerSocket = 5;
      return server;
    }

    const server = createServer({ maxRequestsPerSocket: 4, serverFactory });
    t.assert.strictEqual(server.maxRequestsPerSocket, 5);
  });

  test("update all servers", async (t) => {
    t.plan(3);
    const server = createServer({ maxRequestsPerSocket: 1 }, handler);
    t.assert.strictEqual(server.maxRequestsPerSocket, 1);
    server.listen();
    await once(server, "fastify.listening");
    server.maxRequestsPerSocket = 5;
    t.assert.strictEqual(server.maxRequestsPerSocket, 5);
    for (const internal of server[kInternalServers]) {
      t.assert.strictEqual(internal.maxRequestsPerSocket, 5);
    }
    server.close();
    await once(server, "fastify.close");
  });
});
