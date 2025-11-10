import { useState, useCallback } from 'react'
import { useLoading } from '../context/LoadingContext'

/**
 * Custom hook for handling loading states with API calls
 * @param {Function} apiFunction - The API function to call
 * @param {Object} options - Configuration options
 * @returns {Object} - { data, error, loading, execute, reset }
 */
export function useApiLoading(apiFunction, options = {}) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const { startLoading, stopLoading } = useLoading()

  const {
    useGlobalLoading = false,
    loadingMessage = 'Loading...',
    onSuccess,
    onError,
  } = options

  const execute = useCallback(async (...args) => {
    setLoading(true)
    setError(null)
    
    if (useGlobalLoading) {
      startLoading(loadingMessage)
    }

    try {
      const response = await apiFunction(...args)
      setData(response.data)
      
      if (onSuccess) {
        onSuccess(response.data)
      }
      
      return response.data
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred'
      setError(errorMessage)
      
      if (onError) {
        onError(err)
      }
      
      throw err
    } finally {
      setLoading(false)
      if (useGlobalLoading) {
        stopLoading()
      }
    }
  }, [apiFunction, useGlobalLoading, loadingMessage, onSuccess, onError, startLoading, stopLoading])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return {
    data,
    error,
    loading,
    execute,
    reset,
  }
}

/**
 * Custom hook for handling multiple API calls with loading state
 * @returns {Object} - { loading, executeWithLoading }
 */
export function useMultipleApiLoading() {
  const [loading, setLoading] = useState(false)
  const [activeRequests, setActiveRequests] = useState(0)

  const executeWithLoading = useCallback(async (apiCalls) => {
    setLoading(true)
    setActiveRequests(apiCalls.length)

    try {
      const results = await Promise.allSettled(apiCalls)
      return results
    } finally {
      setLoading(false)
      setActiveRequests(0)
    }
  }, [])

  return {
    loading,
    activeRequests,
    executeWithLoading,
  }
}
