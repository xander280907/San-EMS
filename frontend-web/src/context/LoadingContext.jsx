import { createContext, useContext, useState } from 'react'

const LoadingContext = createContext()

export function useLoading() {
  const context = useContext(LoadingContext)
  if (!context) {
    throw new Error('useLoading must be used within LoadingProvider')
  }
  return context
}

export function LoadingProvider({ children }) {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingCount, setLoadingCount] = useState(0)
  const [loadingMessage, setLoadingMessage] = useState('')

  const startLoading = (message = 'Loading...') => {
    setLoadingCount(prev => prev + 1)
    setIsLoading(true)
    setLoadingMessage(message)
  }

  const stopLoading = () => {
    setLoadingCount(prev => {
      const newCount = Math.max(0, prev - 1)
      if (newCount === 0) {
        setIsLoading(false)
        setLoadingMessage('')
      }
      return newCount
    })
  }

  const resetLoading = () => {
    setLoadingCount(0)
    setIsLoading(false)
    setLoadingMessage('')
  }

  const value = {
    isLoading,
    loadingMessage,
    startLoading,
    stopLoading,
    resetLoading,
  }

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  )
}
