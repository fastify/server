"use strict";
const { describe, test } = require("node:test");
const dns = require("node:dns");
const os = require("node:os");
const path = require("node:path");
const fs = require("node:fs");
const { createServer } = require("../lib");

const handler = (_request, response) => {
  response.writeHead(200, { "Content-Type": "application/json" });
  response.end(JSON.stringify({ data: "Hello World!" }));
};

describe("listeningOrigin", () => {
  test("ipv4", async (t) => {
    t.plan(1);
    const lookup = dns.lookup;
    const { mock } = t.mock.method(
      dns,
      "lookup",
      (hostname, options, callback) => {
        if (hostname === "localhost") {
          callback(null, [{ address: "127.0.0.1", family: 4 }]);
        } else {
          lookup(hostname, options, callback);
        }
      },
    );

    const server = createServer({}, handler);
    await server.listen();
    const address = server.address();
    t.assert.strictEqual(
      server.listeningOrigin,
      `http://127.0.0.1:${address.port}`,
    );
    await server.close();
    mock.restore();
  });

  test("ipv6", async (t) => {
    t.plan(1);
    const lookup = dns.lookup;
    const { mock } = t.mock.method(
      dns,
      "lookup",
      (hostname, options, callback) => {
        if (hostname === "localhost") {
          callback(null, [{ address: "::1", family: 6 }]);
        } else {
          lookup(hostname, options, callback);
        }
      },
    );

    const server = createServer({}, handler);
    await server.listen();
    const address = server.address();
    t.assert.strictEqual(
      server.listeningOrigin,
      `http://[::1]:${address.port}`,
    );
    await server.close();
    mock.restore();
  });

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

  test("path", { skip: !sockPath }, async (t) => {
    t.plan(1);

    const server = createServer({}, handler);
    await server.listen({ path: sockPath });
    t.assert.strictEqual(server.listeningOrigin, sockPath);
    await server.close();
  });

  test("https + ipv4", async (t) => {
    t.plan(1);
    const lookup = dns.lookup;
    const { mock } = t.mock.method(
      dns,
      "lookup",
      (hostname, options, callback) => {
        if (hostname === "localhost") {
          callback(null, [{ address: "127.0.0.1", family: 4 }]);
        } else {
          lookup(hostname, options, callback);
        }
      },
    );

    const server = createServer({ https: {} }, handler);
    await server.listen();
    const address = server.address();
    t.assert.strictEqual(
      server.listeningOrigin,
      `https://127.0.0.1:${address.port}`,
    );
    await server.close();
    mock.restore();
  });

  test("ipv6", async (t) => {
    t.plan(1);
    const lookup = dns.lookup;
    const { mock } = t.mock.method(
      dns,
      "lookup",
      (hostname, options, callback) => {
        if (hostname === "localhost") {
          callback(null, [{ address: "::1", family: 6 }]);
        } else {
          lookup(hostname, options, callback);
        }
      },
    );

    const server = createServer({ https: {} }, handler);
    await server.listen();
    const address = server.address();
    t.assert.strictEqual(
      server.listeningOrigin,
      `https://[::1]:${address.port}`,
    );
    await server.close();
    mock.restore();
  });
});
