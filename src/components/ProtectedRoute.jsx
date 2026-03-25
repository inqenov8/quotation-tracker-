import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, profile, loading } = useAuth()

  if (loading) return <div>Loading...</div>
  if (!user) return <Navigate to="/login" replace />

  if (allowedRoles.length && (!profile || !allowedRoles.includes(profile.role))) {
    return <Navigate to="/" replace />
  }

  return children
}
