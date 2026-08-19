"use strict";
const { describe, test, before } = require("node:test");
const { createServer } = require("../../lib");
const { withResolvers } = require("../../lib/utils");
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

describe("listen again after close", () => {
  before(localhostCount);

  test(".listen()", async (t) => {
    t.plan(6);
    const { promise, resolve } = withResolvers();

    const server = createServer({}, handler);
    t.assert.strictEqual(server.listening, false);

    server.listen({}, (error) => {
      t.assert.ifError(error);
      const addresses = server.addresses();
      t.assert.strictEqual(addresses.length, global.context.localhostCount);

      server.close(() => {
        t.assert.strictEqual(server.listening, false);

        server.listen({}, (error) => {
          t.assert.ifError(error);
          const addresses = server.addresses();
          t.assert.strictEqual(addresses.length, global.context.localhostCount);
          server.close(resolve);
        });
      });
    });

    await promise;
  });

  test(".listen({ host: '127.0.0.1' })", async (t) => {
    t.plan(6);
    const { promise, resolve } = withResolvers();

    const server = createServer({}, handler);
    t.assert.strictEqual(server.listening, false);

    server.listen(
      {
        host: "127.0.0.1",
      },
      (error) => {
        t.assert.ifError(error);
        const addresses = server.addresses();
        t.assert.strictEqual(addresses.length, 1);

        server.close(() => {
          t.assert.strictEqual(server.listening, false);

          server.listen(
            {
              host: "127.0.0.1",
            },
            (error) => {
              t.assert.ifError(error);
              const addresses = server.addresses();
              t.assert.strictEqual(addresses.length, 1);
              server.close(resolve);
            },
          );
        });
      },
    );

    await promise;
  });
});
