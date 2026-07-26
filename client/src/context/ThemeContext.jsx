import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext({
  isDark: false,
  toggleTheme: () => {},
  setTheme: () => {},
})

const applyTheme = (dark) => {
  const root = document.documentElement
  if (dark) {
    root.classList.add('dark')
    root.style.colorScheme = 'dark'
    localStorage.setItem('theme', 'dark')
  } else {
    root.classList.remove('dark')
    root.style.colorScheme = 'light'
    localStorage.setItem('theme', 'light')
  }
}

const getInitialDark = () => {
  const saved = localStorage.getItem('theme')
  if (saved === 'dark' || saved === 'light') {
    return saved === 'dark'
  }
  return false
}

export const useTheme = () => useContext(ThemeContext)

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const dark = getInitialDark()
    applyTheme(dark)
    return dark
  })

  useEffect(() => {
    applyTheme(isDark)
  }, [isDark])

  const toggleTheme = () => setIsDark((prev) => !prev)
  const setTheme = (theme) => setIsDark(theme === 'dark')

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
