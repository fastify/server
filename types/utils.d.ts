type Callback<T = unknown> = (error?: null | Error, data?: T) => void;

export function normalizeCallback(callback?: Callback): Callback;

export function withResolvers<T = unknown>(): {
  promise: Promise<T>;
  resolve: (data?: T) => void;
  reject: (error?: null | Error) => void;
};
