import tokens from './tokens.json'

export type ThemeMode = 'light' | 'dark'

export interface DesignTokens {
  spacing: Record<string, string>
  radii: Record<string, string>
  shadows: Record<string, string | Record<string, string>>
  zIndex: Record<string, number>
  typography: {
    fontFamily: Record<string, string>
    fontSize: Record<string, string>
    fontWeight: Record<string, number>
    lineHeight: Record<string, number>
    letterSpacing: Record<string, string>
  }
  colors: Record<string, string>
  gradients: Record<string, string | Record<string, string>>
  motion: {
    duration: Record<string, string>
    easing: Record<string, string>
  }
  hitArea: Record<string, string>
  breakpoints: Record<string, string>
}

export function getThemeTokens(mode: ThemeMode): DesignTokens {
  return {
    ...tokens,
    colors: tokens.colors[mode]
  } as DesignTokens
}

export function applyTheme(mode: ThemeMode) {
  const root = document.documentElement
  const colors = tokens.colors[mode]

  Object.entries(colors).forEach(([key, value]) => {
    const cssVarName = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`
    root.style.setProperty(cssVarName, value)
  })

  if (mode === 'dark') {
    root.classList.add('dark')
    root.classList.remove('light')
  } else {
    root.classList.add('light')
    root.classList.remove('dark')
  }
}

export const designTokens = tokens
