# Button and Navigation Loading Guide

Complete guide for implementing loading animations on buttons and navigation in the EMS system.

## ✨ What's Been Implemented

### 1. **Route Loading Bar**
- Appears at the top of the screen during page navigation
- Smooth progress animation
- Automatically triggered on every route change

### 2. **LoadingButton Component**
- Reusable button with built-in loading state
- Multiple variants and sizes
- Icon support
- Disabled state when loading

### 3. **Navigation Loading States**
- Active route highlighting
- Smooth transitions
- Logout button with loading animation

---

## 🎯 LoadingButton Component

### Basic Usage

```jsx
import LoadingButton from '../components/LoadingButton'
import { Save } from 'lucide-react'

function MyComponent() {
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.post('/save', data)
    } finally {
      setSaving(false)
    }
  }

  return (
    <LoadingButton 
      onClick={handleSave}
      loading={saving}
      loadingText="Saving..."
    >
      Save Changes
    </LoadingButton>
  )
}
```

### All Props

```jsx
<LoadingButton
  loading={boolean}              // Loading state
  disabled={boolean}             // Disabled state
  variant="primary"              // Style variant
  size="md"                      // Button size
  icon={<Save />}                // Optional icon
  loadingText="Processing..."    // Text when loading
  onClick={handleClick}          // Click handler
  className="custom-class"       // Additional classes
  type="submit"                  // Button type
>
  Button Text
</LoadingButton>
```

### Available Variants

- `primary` - Blue (default)
- `secondary` - Gray
- `success` - Green
- `danger` - Red
- `warning` - Yellow
- `info` - Cyan
- `outline` - White with border
- `ghost` - Transparent

### Available Sizes

- `xs` - Extra small
- `sm` - Small
- `md` - Medium (default)
- `lg` - Large
- `xl` - Extra large

---

## 📝 Common Use Cases

### 1. Form Submit Button

```jsx
import LoadingButton from '../components/LoadingButton'

function EmployeeForm() {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      await employeeAPI.create(formData)
      toast.success('Employee created!')
    } catch (error) {
      toast.error('Failed to create employee')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      
      <LoadingButton
        type="submit"
        loading={loading}
        loadingText="Creating..."
        variant="success"
        size="lg"
      >
        Create Employee
      </LoadingButton>
    </form>
  )
}
```

### 2. Delete Button with Confirmation

```jsx
import LoadingButton from '../components/LoadingButton'
import { Trash2 } from 'lucide-react'

function DeleteButton({ employeeId, onDelete }) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this employee?')) return
    
    setDeleting(true)
    try {
      await employeeAPI.delete(employeeId)
      onDelete()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <LoadingButton
      onClick={handleDelete}
      loading={deleting}
      loadingText="Deleting..."
      variant="danger"
      icon={<Trash2 />}
    >
      Delete
    </LoadingButton>
  )
}
```

### 3. Multiple Buttons in a Row

```jsx
import LoadingButton from '../components/LoadingButton'
import { Save, X, Send } from 'lucide-react'

function ActionButtons() {
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)

  return (
    <div className="flex gap-3">
      <LoadingButton
        onClick={handleSave}
        loading={saving}
        variant="primary"
        icon={<Save />}
      >
        Save Draft
      </LoadingButton>

      <LoadingButton
        onClick={handleSend}
        loading={sending}
        variant="success"
        icon={<Send />}
      >
        Send
      </LoadingButton>

      <LoadingButton
        onClick={handleCancel}
        variant="outline"
        icon={<X />}
      >
        Cancel
      </LoadingButton>
    </div>
  )
}
```

### 4. Icon-Only Button

```jsx
import { LoadingIconButton } from '../components/LoadingButton'
import { Edit, Trash } from 'lucide-react'

function ActionIcons({ item }) {
  const [editing, setEditing] = useState(false)

  return (
    <div className="flex gap-2">
      <LoadingIconButton
        onClick={handleEdit}
        loading={editing}
        icon={<Edit />}
        variant="primary"
        ariaLabel="Edit item"
      />
      
      <LoadingIconButton
        onClick={handleDelete}
        icon={<Trash />}
        variant="danger"
        ariaLabel="Delete item"
      />
    </div>
  )
}
```

### 5. Table Action Buttons

```jsx
import LoadingButton from '../components/LoadingButton'
import { CheckCircle, XCircle } from 'lucide-react'

function LeaveRequestRow({ request }) {
  const [approving, setApproving] = useState(false)
  const [rejecting, setRejecting] = useState(false)

  return (
    <tr>
      <td>{request.employee_name}</td>
      <td>{request.leave_type}</td>
      <td>
        <div className="flex gap-2">
          <LoadingButton
            onClick={() => handleApprove(request.id)}
            loading={approving}
            variant="success"
            size="sm"
            icon={<CheckCircle />}
          >
            Approve
          </LoadingButton>

          <LoadingButton
            onClick={() => handleReject(request.id)}
            loading={rejecting}
            variant="danger"
            size="sm"
            icon={<XCircle />}
          >
            Reject
          </LoadingButton>
        </div>
      </td>
    </tr>
  )
}
```

---

## 🎨 Styling Examples

### Custom Colors

```jsx
<LoadingButton
  onClick={handleClick}
  loading={loading}
  className="bg-purple-600 hover:bg-purple-700 text-white"
>
  Custom Color
</LoadingButton>
```

### Full Width Button

```jsx
<LoadingButton
  onClick={handleClick}
  loading={loading}
  className="w-full"
  variant="primary"
  size="lg"
>
  Full Width Button
</LoadingButton>
```

### With Shadow and Rounded

```jsx
<LoadingButton
  onClick={handleClick}
  loading={loading}
  className="shadow-lg rounded-xl"
  variant="success"
>
  Fancy Button
</LoadingButton>
```

---

## 🔄 Route Loading Bar

The route loading bar is **automatically active** on all route changes. No additional code needed!

### How It Works

```jsx
// In App.jsx - already implemented
import RouteLoadingBar from './components/RouteLoadingBar'

function App() {
  return (
    <LoadingProvider>
      <AuthProvider>
        <RouteLoadingBar />  {/* Shows on every route change */}
        <GlobalLoading />
        <AppRoutes />
      </AuthProvider>
    </LoadingProvider>
  )
}
```

### Customization

If you want to customize the loading bar appearance:

```jsx
// RouteLoadingBar.jsx
<div
  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
  style={{
    width: `${progress}%`,
    boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)',
  }}
/>
```

---

## 🎯 Navigation Active States

Navigation links now have active states with smooth transitions:

```jsx
// In Layout.jsx - already implemented
<Link
  to={item.path}
  className={`
    flex items-center px-6 py-3 transition-all duration-200
    ${isActive 
      ? 'bg-primary-100 text-primary-700 font-semibold border-r-4 border-primary-600' 
      : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600'
    }
  `}
>
  <Icon className="w-5 h-5 mr-3" />
  <span>{item.label}</span>
</Link>
```

---

## 📋 Migration Checklist

To add loading to existing buttons in your pages:

### ❌ Before
```jsx
<button onClick={handleSave} disabled={loading}>
  {loading ? 'Saving...' : 'Save'}
</button>
```

### ✅ After
```jsx
import LoadingButton from '../components/LoadingButton'

<LoadingButton 
  onClick={handleSave} 
  loading={loading}
  loadingText="Saving..."
>
  Save
</LoadingButton>
```

---

## 🎨 Complete Example

```jsx
import { useState } from 'react'
import LoadingButton from '../components/LoadingButton'
import { Save, Send, Trash } from 'lucide-react'
import { employeeAPI } from '../services/api'

function EmployeeActions({ employee }) {
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await employeeAPI.update(employee.id, formData)
      toast.success('Saved successfully!')
    } catch (error) {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleSendEmail = async () => {
    setSending(true)
    try {
      await api.post(`/employees/${employee.id}/send-email`)
      toast.success('Email sent!')
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this employee?')) return
    
    setDeleting(true)
    try {
      await employeeAPI.delete(employee.id)
      toast.success('Deleted!')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex gap-3">
      <LoadingButton
        onClick={handleSave}
        loading={saving}
        loadingText="Saving..."
        variant="primary"
        icon={<Save />}
      >
        Save Changes
      </LoadingButton>

      <LoadingButton
        onClick={handleSendEmail}
        loading={sending}
        loadingText="Sending..."
        variant="info"
        icon={<Send />}
      >
        Send Email
      </LoadingButton>

      <LoadingButton
        onClick={handleDelete}
        loading={deleting}
        loadingText="Deleting..."
        variant="danger"
        icon={<Trash />}
      >
        Delete
      </LoadingButton>
    </div>
  )
}

export default EmployeeActions
```

---

## 🚀 Summary

**What's Active Now:**
✅ Route loading bar on all navigation  
✅ LoadingButton component available everywhere  
✅ Active navigation states in sidebar  
✅ Logout button with loading animation  

**To Use in Your Pages:**
1. Import `LoadingButton` from `../components/LoadingButton`
2. Replace regular `<button>` with `<LoadingButton>`
3. Add `loading` and `loadingText` props
4. Enjoy automatic loading animations!

For more examples, see: `LoadingExample.jsx` in the components folder.
