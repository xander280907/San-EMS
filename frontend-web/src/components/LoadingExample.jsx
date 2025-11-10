/**
 * EXAMPLE COMPONENT - Demonstrates all loading features
 * This file is for reference and should not be used in production
 */

import { useState, useEffect } from 'react'
import { useLoading } from '../context/LoadingContext'
import { useApiLoading, useMultipleApiLoading } from '../hooks/useApiLoading'
import LoadingSpinner, { SkeletonLoader, CardSkeleton, TableSkeleton } from './LoadingSpinner'
import api from '../services/api'

export default function LoadingExample() {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold mb-8">Loading Features Demo</h1>

      {/* Example 1: Basic Loading Spinner */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">1. Basic Loading Spinner</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <LoadingSpinner size="sm" message="Small" />
            <LoadingSpinner size="md" message="Medium" />
            <LoadingSpinner size="lg" message="Large" />
            <LoadingSpinner size="xl" message="Extra Large" />
          </div>
        </div>
      </section>

      {/* Example 2: Skeleton Loaders */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">2. Skeleton Loaders</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Basic Skeleton</h3>
            <SkeletonLoader className="h-4 w-full mb-2" count={3} />
          </div>
          <div>
            <h3 className="font-medium mb-2">Card Skeleton</h3>
            <div className="grid grid-cols-3 gap-4">
              <CardSkeleton count={3} />
            </div>
          </div>
          <div>
            <h3 className="font-medium mb-2">Table Skeleton</h3>
            <TableSkeleton rows={5} columns={4} />
          </div>
        </div>
      </section>

      {/* Example 3: Global Loading Context */}
      <GlobalLoadingExample />

      {/* Example 4: useApiLoading Hook */}
      <ApiLoadingExample />

      {/* Example 5: Multiple API Calls */}
      <MultipleApiExample />

      {/* Example 6: Local Loading State */}
      <LocalLoadingExample />
    </div>
  )
}

// Example 3: Using Global Loading Context
function GlobalLoadingExample() {
  const { startLoading, stopLoading, isLoading } = useLoading()

  const handleGlobalLoading = () => {
    startLoading('Processing global action...')
    setTimeout(() => {
      stopLoading()
    }, 2000)
  }

  return (
    <section className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">3. Global Loading Context</h2>
      <button
        onClick={handleGlobalLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Trigger Global Loading (2s)
      </button>
      <p className="mt-2 text-sm text-gray-600">
        Status: {isLoading ? 'Loading...' : 'Idle'}
      </p>
    </section>
  )
}

// Example 4: Using useApiLoading Hook
function ApiLoadingExample() {
  const { data, error, loading, execute } = useApiLoading(
    () => api.get('/employees'),
    {
      useGlobalLoading: false,
      loadingMessage: 'Fetching employees...',
      onSuccess: (data) => console.log('Employees loaded:', data),
      onError: (err) => console.error('Error loading employees:', err),
    }
  )

  return (
    <section className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">4. useApiLoading Hook</h2>
      <button
        onClick={() => execute({ per_page: 5 })}
        disabled={loading}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? 'Loading...' : 'Fetch Employees'}
      </button>
      {loading && (
        <div className="mt-4">
          <LoadingSpinner message="Loading employees..." />
        </div>
      )}
      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded">
          Error: {error}
        </div>
      )}
      {data && !loading && (
        <div className="mt-4 p-4 bg-green-50 text-green-700 rounded">
          Loaded {data?.data?.length || 0} employees
        </div>
      )}
    </section>
  )
}

// Example 5: Multiple API Calls
function MultipleApiExample() {
  const { loading, activeRequests, executeWithLoading } = useMultipleApiLoading()
  const [results, setResults] = useState(null)

  const handleMultipleCalls = async () => {
    const apiResults = await executeWithLoading([
      api.get('/employees', { params: { per_page: 1 } }),
      api.get('/departments'),
      api.get('/attendance', { params: { per_page: 1 } }),
    ])
    setResults(apiResults)
  }

  return (
    <section className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">5. Multiple API Calls</h2>
      <button
        onClick={handleMultipleCalls}
        disabled={loading}
        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
      >
        {loading ? `Loading... (${activeRequests} requests)` : 'Fetch Multiple APIs'}
      </button>
      {loading && (
        <div className="mt-4">
          <LoadingSpinner message={`Processing ${activeRequests} requests...`} />
        </div>
      )}
      {results && !loading && (
        <div className="mt-4 space-y-2">
          {results.map((result, index) => (
            <div
              key={index}
              className={`p-3 rounded ${
                result.status === 'fulfilled'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              API {index + 1}: {result.status}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

// Example 6: Local Loading State
function LocalLoadingExample() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)

  const handleLocalLoading = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      setData({ message: 'Data loaded successfully!' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">6. Local Loading State</h2>
      <button
        onClick={handleLocalLoading}
        disabled={loading}
        className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Local Action'}
      </button>
      {loading && (
        <div className="mt-4">
          <CardSkeleton count={1} />
        </div>
      )}
      {data && !loading && (
        <div className="mt-4 p-4 bg-blue-50 text-blue-700 rounded">
          {data.message}
        </div>
      )}
    </section>
  )
}
