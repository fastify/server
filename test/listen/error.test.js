"use strict";
const { describe, test, before } = require("node:test");
const { once } = require("node:stream");
const http = require("node:http");
const { nextTick } = require("node:process");
const { createServer } = require("../../lib");
const { withResolvers } = require("../../lib/utils");
const { localhostCount } = require("../utils");

const handler = (_request, response) => {
  response.writeHead(200, { "Content-Type": "application/json" });
  response.end(JSON.stringify({ data: "Hello World!" }));
};

describe("error", () => {
  before(localhostCount);

  describe("ERR_SERVER_ALREADY_LISTEN", () => {
    test(".listen()", async (t) => {
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
        const addresses = server.addresses();
        t.assert.strictEqual(addresses.length, global.context.localhostCount);
        server.listen({}, (error) => {
          t.assert.strictEqual(error.code, "ERR_SERVER_ALREADY_LISTEN");
          server.close();
        });
      });

      await promise;
    });

    test(".listen({ host: '127.0.0.1' })", async (t) => {
      t.plan(5);
      const { promise, resolve } = withResolvers();

      const server = createServer({}, handler);
      t.assert.strictEqual(server.listening, false);

      server.once("fastify.close", () => {
        t.assert.strictEqual(server.listening, false);
        resolve();
      });

      server.listen({ host: "127.0.0.1" }, (error) => {
        t.assert.ifError(error);
        const addresses = server.addresses();
        t.assert.strictEqual(addresses.length, 1);
        server.listen({ host: "127.0.0.1" }, (error) => {
          t.assert.strictEqual(error.code, "ERR_SERVER_ALREADY_LISTEN");
          server.close();
        });
      });

      await promise;
    });

    test("await .listen()", async (t) => {
      t.plan(3);

      const server = createServer({}, handler);
      t.assert.strictEqual(server.listening, false);

      await server.listen();
      const addresses = server.addresses();
      t.assert.strictEqual(addresses.length, global.context.localhostCount);

      try {
        await server.listen();
      } catch (error) {
        t.assert.strictEqual(error.code, "ERR_SERVER_ALREADY_LISTEN");
      } finally {
        await server.close();
      }
    });

    test("await .listen({ host: '127.0.0.1' })", async (t) => {
      t.plan(3);
      const server = createServer({}, handler);
      t.assert.strictEqual(server.listening, false);

      await server.listen({ host: "127.0.0.1" });
      const addresses = server.addresses();
      t.assert.strictEqual(addresses.length, 1);

      try {
        await server.listen({ host: "127.0.0.1" });
      } catch (error) {
        t.assert.strictEqual(error.code, "ERR_SERVER_ALREADY_LISTEN");
      } finally {
        await server.close();
      }
    });
  });

  describe("EADDRINUSE", () => {
    test("listen conflict address and port", async (t) => {
      t.plan(3);
      const { promise, resolve } = withResolvers();

      const server = createServer({}, handler);
      const conflict = createServer({}, handler);

      server.listen({}, (error, address) => {
        t.assert.ifError(error);
        const addresses = server.addresses();
        t.assert.strictEqual(addresses.length, global.context.localhostCount);

        conflict.listen({ port: address.port }, (error) => {
          t.assert.strictEqual(error.code, "EADDRINUSE");
          server.close(resolve);
        });
      });

      await promise;
    });

    test("allow listen after conflict", async (t) => {
      t.plan(3);
      const { promise, resolve } = withResolvers();
      const net = require("node:net");
      const conflict = net.createServer();
      conflict.listen({ port: 0, host: "127.0.0.1" });
      await once(conflict, "listening");

      const server = createServer({}, handler);

      const listenOptions = {
        port: conflict.address().port,
        host: "127.0.0.1",
      };
      server.listen(listenOptions, (error) => {
        t.assert.strictEqual(error.code, "EADDRINUSE");

        conflict.close();

        server.listen(listenOptions, (error) => {
          t.assert.ifError(error);
          t.assert.strictEqual(server.listening, true);

          server.close(resolve);
        });
      });

      await promise;
    });
  });

  test("second server listen error", async (t) => {
    t.plan(1);

    const httpCreateServer = http.createServer;
    let count = 0;
    const { mock } = t.mock.method(http, "createServer", (...args) => {
      const server = httpCreateServer(...args);
      if (count === 1) {
        // delay to simulate the error throw in new server
        nextTick(() => {
          server.emit("error", new Error("kaboom!"));
          server.close();
        });
      }
      count++;
      return server;
    });
    const server = createServer({}, handler);
    await server.listen();
    t.assert.strictEqual(server.addresses().length, 1);
    await server.close();
    mock.restore();
  });
});
