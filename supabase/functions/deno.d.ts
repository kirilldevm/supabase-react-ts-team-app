/** Minimal globals for Edge Functions — full types come from the Deno runtime. */
declare var Deno: {
  env: {
    get(key: string): string | undefined;
  };
};
