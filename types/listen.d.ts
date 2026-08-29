import type { AddressInfo, ListenOptions as NetListenOptions } from "node:net";
import type { ProxyServer, ServerState } from ".";
import type { RequestListener, ServerOptions } from "./server";

export interface ListenOptions extends NetListenOptions {}

export type NormalizeListenOptionsFn = (
  options?: ListenOptions,
) => ListenOptions;

export type LookupHostsCallback = (
  addresses: Array<string | AddressInfo>,
) => void;

export type LookupHostsFn = (
  listenOptions: ListenOptions,
  state: ServerState,
  callback: LookupHostsCallback,
) => void;

export type ListenLookupHostsCallback = (error?: null | Error) => void;

export type ListenLookupHostsFn = (
  proxy: ProxyServer,
  requestHandler: RequestListener,
  serverOptions: ServerOptions,
  listenOptions: ListenOptions,
  callback: ListenLookupHostsCallback,
) => void;
