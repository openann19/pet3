import { createContext, useContext, useEffect, ReactNode } from 'react'
import { useStorage } from '@/hooks/useStorage'
import { applyTheme, type ThemeMode } from './themes'

interface ThemeContextType {
  mode: ThemeMode
  setMode: (mode: ThemeMode | ((current: ThemeMode) => ThemeMode)) => void
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useStorage<ThemeMode>('theme-mode-v2', 'light')

  useEffect(() => {
    applyTheme(mode)
  }, [mode])

  const toggle = () => {
    setMode((current) => (current === 'light' ? 'dark' : 'light'))
  }

  return (
    <ThemeContext.Provider value={{ mode, setMode, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useThemeSystem() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useThemeSystem must be used within ThemeProvider')
  }
  return context
}
