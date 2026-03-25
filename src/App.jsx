import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import DashboardPage from './pages/DashboardPage'
import QuotesPage from './pages/QuotesPage'
import ApprovalPage from './pages/ApprovalPage'
import AdminPage from './pages/AdminPage'

function AppRoutes() {
  const { user } = useAuth()
  if (!user) return <Login />
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/quotes/*" element={<QuotesPage />} />
      <Route path="/approvals" element={<ApprovalPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
