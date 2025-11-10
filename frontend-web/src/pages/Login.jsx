import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Building2, Loader2, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login({ email, password })
      navigate('/')
    } catch (err) {
      console.error('Login error:', err)
      console.error('Error response:', err.response?.data)
      let errorMessage = 'Login failed'
      
      if (err.response) {
        // Server responded with error status
        const data = err.response.data || {}
        
        // Log full error data for debugging
        console.log('Full error data:', JSON.stringify(data, null, 2))
        
        if (data.error) {
          if (typeof data.error === 'string') {
            errorMessage = data.error
          } else if (typeof data.error === 'object') {
            // Handle validation errors
            errorMessage = Object.values(data.error).flat().join(', ')
          }
        }
        
        // Add detailed message if available (for debugging)
        if (data.message) {
          errorMessage = errorMessage && errorMessage !== 'Login failed' 
            ? `${errorMessage}: ${data.message}` 
            : data.message
        }
        
        // Show file/line if available (for debugging)
        if (data.file && data.line) {
          errorMessage += ` [${data.file.split('\\').pop().split('/').pop()}:${data.line}]`
        }
        
        // If no error message found, use status text
        if (!errorMessage || errorMessage === 'Login failed') {
          errorMessage = data.message || err.response.statusText || `Error ${err.response.status}`
        }
        
        // Show trace if available
        if (data.trace && process.env.NODE_ENV === 'development') {
          console.error('Error trace:', data.trace)
        }
      } else if (err.request) {
        errorMessage = 'Unable to connect to server. Please check your connection and ensure the backend is running on http://localhost:8000'
      } else {
        errorMessage = err.message || 'An unexpected error occurred'
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="flex justify-center mb-6">
          <div className="bg-primary-100 p-4 rounded-full">
            <Building2 className="w-12 h-12 text-primary-600" />
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
          EMS
        </h2>
        <p className="text-center text-gray-600 mb-8">
          Employee Management System
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p className="font-semibold">Default Credentials:</p>
          <p>Admin: admin@test.local / password</p>
          <p>HR: hr@test.local / password</p>
        </div>
      </div>
    </div>
  )
}
