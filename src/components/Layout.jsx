import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Layout({ children }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/" className="flex items-center text-xl font-bold text-indigo-600">
                VMU Quotation Tracker
              </Link>
              <div className="ml-6 flex space-x-4">
                <Link to="/" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900">Dashboard</Link>
                <Link to="/quotes" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900">Quotes</Link>
                {profile?.role === 'approver' && (
                  <Link to="/approvals" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900">Approvals</Link>
                )}
                {profile?.role === 'admin' && (
                  <Link to="/admin" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900">Admin</Link>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">{profile?.name || profile?.email}</span>
              <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-800">Logout</button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
