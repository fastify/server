const { describe, test } = require("node:test");
const { createServer } = require("../../lib");

const handler = (_request, response) => {
  response.writeHead(200, { "Content-Type": "application/json" });
  response.end(JSON.stringify({ data: "Hello World!" }));
};

describe("double close", () => {
  test("should not emit close twice", async (t) => {
    let count = 0;
    const server = createServer({}, handler);
    server.on("fastify.close", () => count++);
    await server.listen();
    await server.close();
    await server.close();
    t.assert.strictEqual(count, 1);
  });
});
