// Dev viewer switch: off for players, on in Vite dev mode or with `?dev`.
export function isDevMode(env: { viteDev: boolean; search: string }): boolean {
  return env.viteDev || new URLSearchParams(env.search).has('dev');
}
