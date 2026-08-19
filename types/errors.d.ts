import type { FastifyErrorConstructor } from "@fastify/error";

export type ERR_SERVER_ALREADY_LISTEN = FastifyErrorConstructor<
  {
    code: "ERR_SERVER_ALREADY_LISTEN";
  },
  []
>;
