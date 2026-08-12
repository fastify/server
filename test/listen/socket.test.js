"use strict";
const { describe, test } = require("node:test");
const os = require("node:os");
const path = require("node:path");
const fs = require("node:fs");
const { createServer } = require("../../lib");
const { withResolvers } = require("../../lib/utils");

const handler = (_request, response) => {
  response.writeHead(200, { "Content-Type": "application/json" });
  response.end(JSON.stringify({ data: "Hello World!" }));
};

describe("socket", () => {
  let sockPath = "";
  if (os.platform() !== "win32") {
    sockPath = path.join(
      os.tmpdir(),
      `${(`${Math.random().toString(16)}0000000`).slice(2, 10)}-server.sock`,
    );
    try {
      fs.unlinkSync(sockFile);
    } catch {}
  } else {
    sockPath = `\\\\.\\pipe\\${(`${Math.random().toString(16)}0000000`).slice(2, 10)}-server-sock`;
  }

  test(".listen({ path })", { skip: !sockPath }, async (t) => {
    t.plan(5);
    const { promise, resolve } = withResolvers();

    const server = createServer({}, handler);
    t.assert.strictEqual(server.listening, false);

    server.once("fastify.listening", () => {
      t.assert.strictEqual(server.listening, true);
      const addresses = server.addresses();
      t.assert.strictEqual(addresses.length, 1);
      t.assert.deepStrictEqual(addresses, [sockPath]);
      server.close();
    });
    server.once("fastify.close", () => {
      t.assert.strictEqual(server.listening, false);
      resolve();
    });

    server.listen({ path: sockPath });

    await promise;
  });

  // Refs: https://github.com/fastify/fastify/pull/6937
  test(".listen({ path, host })", { skip: !sockPath }, async (t) => {
    t.plan(4);

    const server = createServer({}, handler);
    t.assert.strictEqual(server.listening, false);

    await server.listen({ path: sockPath, host: "localhost" });

    t.assert.strictEqual(server.listening, true);
    const addresses = server.addresses();
    t.assert.strictEqual(addresses.length, 1);
    t.assert.deepStrictEqual(addresses, [sockPath]);

    await server.close();
  });
});
