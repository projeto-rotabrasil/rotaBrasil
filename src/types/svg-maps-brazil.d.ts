// O pacote @svg-maps/brazil não traz tipos. Descrevemos só o que usamos.
declare module '@svg-maps/brazil' {
  interface SvgMapLocation {
    id: string
    name: string
    path: string
  }

  interface SvgMap {
    label: string
    viewBox: string
    locations: SvgMapLocation[]
  }

  const Brazil: SvgMap
  export default Brazil
}
