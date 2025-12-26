const baseFocus = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'

export const focusRing = {
  default: `${baseFocus} focus-visible:ring-primary-500 focus-visible:ring-offset-background`,
  subtle: `${baseFocus} focus-visible:ring-primary-300 focus-visible:ring-offset-transparent`,
  contrast: `${baseFocus} focus-visible:ring-white/80 focus-visible:ring-offset-black/40`,
}

export default focusRing
