// astronomia ships no type declarations. We use a small, permissive surface:
// the modules and members this project actually calls. Keeps `tsc` happy
// without pulling `any` across the whole codebase.
declare module 'astronomia' {
  export const julian: any
  export const solar: any
  export const moonposition: any
  export const planetposition: any
  export const elliptic: any
  export const coord: any
  export const sidereal: any
  export const nutation: any
  export const base: any
}

declare module 'astronomia/data/*' {
  const data: any
  export default data
}
