const { describe, test } = require("node:test");
const { createServer } = require("../lib");
const { once } = require("node:stream");

const handler = (_request, response) => {
  response.writeHead(200, { "Content-Type": "application/json" });
  response.end(JSON.stringify({ data: "Hello World!" }));
};

describe("abort signal", () => {
  test("should close server when aborted after", async (t) => {
    t.plan(1);

    const controller = new AbortController();

    const server = createServer({}, handler);
    server.listen({ signal: controller.signal });

    await once(server, "fastify.listening");
    controller.abort();
    await once(server, "fastify.close");
    t.assert.strictEqual(server.listening, false);
  });

  test("should close server when aborted before", async (t) => {
    t.plan(1);

    const controller = new AbortController();
    controller.abort();

    const server = createServer({}, handler);
    server.on("listening", () => {
      t.assert.fail("should not reach");
    });
    server.on("close", () => {
      t.assert.fail("should not reach");
    });

    server.listen({ signal: controller.signal });
    t.assert.strictEqual(server.listening, false);
  });

  test("should not start server when aborted", async (t) => {
    t.plan(2);

    const controller = new AbortController();

    const server = createServer({}, handler);
    server.on("listening", () => {
      t.assert.fail("should not reach");
    });
    // signal.abort() will call server.close explicitly
    let closeCount = 0;
    server.on("close", () => {
      closeCount++;
      t.assert.strictEqual(closeCount, 1);
    });

    server.listen({ signal: controller.signal });
    controller.abort();

    t.assert.strictEqual(server.listening, false);
    await once(server, "close");
  });

  test("should not start server when already aborted", async (t) => {
    t.plan(1);

    const controller = new AbortController();

    const server = createServer({}, handler);
    server.on("listening", () => {
      t.assert.fail("should not reach");
    });
    server.on("close", () => {
      t.assert.fail("should not reach");
    });

    controller.abort();
    server.listen({ signal: controller.signal });

    t.assert.strictEqual(server.listening, false);
  });

  test("should ignore invalid signal", async (t) => {
    t.plan(1);

    const server = createServer({}, handler);
    server.listen({ signal: { aborted: true } });
    await once(server, "listening");
    t.assert.strictEqual(server.listening, true);
    server.close();
    await once(server, "close");
  });
});
