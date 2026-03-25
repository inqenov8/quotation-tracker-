import Layout from '../components/Layout'
import ProtectedRoute from '../components/ProtectedRoute'

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <Layout>
        <div>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p>User management and system settings will be implemented here.</p>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
