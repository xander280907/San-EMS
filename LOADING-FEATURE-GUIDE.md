# Loading Feature Guide

This document explains the comprehensive loading system implemented in the EMS System.

## Overview

The loading system provides multiple ways to handle loading states across the application:

1. **Global Loading Context** - Centralized loading state management
2. **Loading Spinner Components** - Reusable UI components for loading indicators
3. **Custom Hooks** - Easy-to-use hooks for handling API calls with loading states
4. **Skeleton Loaders** - Placeholder components for better UX

## Components

### 1. LoadingSpinner

A versatile loading spinner component with multiple display modes.

**Props:**
- `size`: `'sm' | 'md' | 'lg' | 'xl'` (default: `'md'`)
- `message`: String to display below spinner (default: `'Loading...'`)
- `fullScreen`: Boolean - fills entire screen (default: `false`)
- `overlay`: Boolean - shows as overlay with backdrop (default: `false`)

**Usage Examples:**

```jsx
import LoadingSpinner from '../components/LoadingSpinner'

// Basic usage
<LoadingSpinner />

// With custom message and size
<LoadingSpinner size="lg" message="Processing your request..." />

// Full screen loading
<LoadingSpinner fullScreen message="Initializing application..." size="xl" />

// As overlay
<LoadingSpinner overlay message="Saving changes..." size="lg" />
```

### 2. SkeletonLoader

Animated placeholder for loading content.

**Props:**
- `className`: Custom CSS classes for styling
- `count`: Number of skeleton elements to render (default: `1`)

**Usage:**

```jsx
import { SkeletonLoader } from '../components/LoadingSpinner'

<SkeletonLoader className="h-4 w-3/4 mb-2" count={3} />
```

### 3. CardSkeleton

Pre-styled skeleton for card components.

**Props:**
- `count`: Number of card skeletons to render (default: `1`)

**Usage:**

```jsx
import { CardSkeleton } from '../components/LoadingSpinner'

{loading ? <CardSkeleton count={3} /> : <DataCards />}
```

### 4. TableSkeleton

Pre-styled skeleton for table components.

**Props:**
- `rows`: Number of rows (default: `5`)
- `columns`: Number of columns (default: `4`)

**Usage:**

```jsx
import { TableSkeleton } from '../components/LoadingSpinner'

{loading ? <TableSkeleton rows={5} columns={4} /> : <DataTable />}
```

### 5. GlobalLoading

Automatically displays when global loading state is active.

**Note:** This component is already included in `App.jsx` and will show automatically when using the loading context.

## Context & Hooks

### LoadingContext

Provides global loading state management.

**Available Methods:**
- `startLoading(message)` - Activate loading state with optional message
- `stopLoading()` - Deactivate loading state
- `resetLoading()` - Force reset loading state
- `isLoading` - Current loading state (boolean)
- `loadingMessage` - Current loading message (string)

**Usage:**

```jsx
import { useLoading } from '../context/LoadingContext'

function MyComponent() {
  const { startLoading, stopLoading, isLoading } = useLoading()

  const handleAction = async () => {
    startLoading('Processing...')
    try {
      await someApiCall()
    } finally {
      stopLoading()
    }
  }

  return (
    <div>
      {isLoading && <p>Loading...</p>}
      <button onClick={handleAction}>Do Something</button>
    </div>
  )
}
```

### useApiLoading Hook

Simplifies handling loading states for API calls.

**Parameters:**
- `apiFunction`: The API function to call
- `options`: Configuration object
  - `useGlobalLoading`: Boolean - use global loading overlay (default: `false`)
  - `loadingMessage`: String - message for global loading (default: `'Loading...'`)
  - `onSuccess`: Function - callback on success
  - `onError`: Function - callback on error

**Returns:**
- `data`: Response data
- `error`: Error message
- `loading`: Loading state
- `execute`: Function to trigger the API call
- `reset`: Function to reset state

**Usage Example:**

```jsx
import { useApiLoading } from '../hooks/useApiLoading'
import { employeeAPI } from '../services/api'

function EmployeeList() {
  const { data, error, loading, execute } = useApiLoading(
    employeeAPI.getAll,
    {
      useGlobalLoading: true,
      loadingMessage: 'Fetching employees...',
      onSuccess: (data) => console.log('Success!', data),
      onError: (error) => console.error('Error!', error),
    }
  )

  useEffect(() => {
    execute({ per_page: 10 })
  }, [])

  if (loading) return <LoadingSpinner />
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      {data?.map(employee => (
        <div key={employee.id}>{employee.name}</div>
      ))}
    </div>
  )
}
```

### useMultipleApiLoading Hook

Handles multiple API calls with a single loading state.

**Returns:**
- `loading`: Loading state
- `activeRequests`: Number of active requests
- `executeWithLoading`: Function to execute multiple API calls

**Usage Example:**

```jsx
import { useMultipleApiLoading } from '../hooks/useApiLoading'

function Dashboard() {
  const { loading, executeWithLoading } = useMultipleApiLoading()

  useEffect(() => {
    const fetchData = async () => {
      const results = await executeWithLoading([
        api.get('/employees'),
        api.get('/departments'),
        api.get('/attendance'),
      ])
      
      // Process results (they're in Promise.allSettled format)
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          console.log('Success:', result.value)
        } else {
          console.error('Error:', result.reason)
        }
      })
    }

    fetchData()
  }, [])

  if (loading) return <LoadingSpinner />
  return <div>Dashboard content...</div>
}
```

## Best Practices

### 1. Use Skeleton Loaders for Better UX

Instead of showing a spinner for content that has a known structure, use skeleton loaders:

```jsx
// ❌ Not ideal
{loading ? <LoadingSpinner /> : <UserCard data={user} />}

// ✅ Better
{loading ? <CardSkeleton /> : <UserCard data={user} />}
```

### 2. Use Global Loading for Long Operations

For operations like saving, deleting, or processing:

```jsx
const { startLoading, stopLoading } = useLoading()

const handleSave = async () => {
  startLoading('Saving changes...')
  try {
    await api.post('/employees', formData)
  } finally {
    stopLoading()
  }
}
```

### 3. Local Loading for Page-Specific Data

For fetching data specific to a page:

```jsx
const [loading, setLoading] = useState(true)

useEffect(() => {
  fetchData().finally(() => setLoading(false))
}, [])

if (loading) return <LoadingSpinner fullScreen />
```

### 4. Combine Loading States

For complex pages with multiple data sources:

```jsx
const [employeesLoading, setEmployeesLoading] = useState(true)
const [departmentsLoading, setDepartmentsLoading] = useState(true)

const isLoading = employeesLoading || departmentsLoading

return (
  <div>
    {employeesLoading ? <SkeletonLoader count={5} /> : <EmployeesList />}
    {departmentsLoading ? <SkeletonLoader count={3} /> : <DepartmentList />}
  </div>
)
```

## Migration Guide

If you have existing pages without loading indicators:

### Before:
```jsx
const [data, setData] = useState([])

useEffect(() => {
  api.get('/employees').then(res => setData(res.data))
}, [])

return <div>{data.map(...)}</div>
```

### After:
```jsx
const [data, setData] = useState([])
const [loading, setLoading] = useState(true)

useEffect(() => {
  api.get('/employees')
    .then(res => setData(res.data))
    .finally(() => setLoading(false))
}, [])

if (loading) return <LoadingSpinner fullScreen message="Loading employees..." />
return <div>{data.map(...)}</div>
```

### Or using the hook:
```jsx
const { data, loading, execute } = useApiLoading(employeeAPI.getAll)

useEffect(() => {
  execute()
}, [])

if (loading) return <LoadingSpinner fullScreen message="Loading employees..." />
return <div>{data?.map(...)}</div>
```

## Summary

The loading system provides:

✅ **Consistent UI** - Same loading experience across the app  
✅ **Better UX** - Skeleton loaders prevent layout shifts  
✅ **Easy Integration** - Simple hooks and components  
✅ **Flexible** - Multiple options for different use cases  
✅ **Type-Safe** - Full TypeScript support (if using TS)  

For questions or issues, refer to the component source code in:
- `/src/context/LoadingContext.jsx`
- `/src/components/LoadingSpinner.jsx`
- `/src/hooks/useApiLoading.js`
