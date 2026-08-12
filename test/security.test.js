"use strict";
const { describe, test } = require("node:test");
const http = require("node:http");
const { createServer } = require("../lib");

const handler = (_request, response) => {
  response.writeHead(200, { "Content-Type": "application/json" });
  response.end(JSON.stringify({ data: "Hello World!" }));
};

describe("security", () => {
  test("__proto__ should be Node built-in server", (t) => {
    const server = createServer({}, handler);
    const nodeServer = http.createServer({}, handler);

    t.assert.deepStrictEqual(server.__proto__, nodeServer.__proto__);
  });

  test("prototype should be Node built-in server", (t) => {
    const server = createServer({}, handler);
    const nodeServer = http.createServer({}, handler);

    t.assert.deepStrictEqual(server.prototype, nodeServer.prototype);
  });
});
