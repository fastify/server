import type { FastifyErrorConstructor } from "@fastify/error";

export const ERR_SERVER_ALREADY_LISTEN: FastifyErrorConstructor<
  { code: "ERR_SERVER_ALREADY_LISTEN" },
  []
>;
