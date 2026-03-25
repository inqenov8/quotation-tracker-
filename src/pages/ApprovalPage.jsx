import Layout from '../components/Layout'
import ApprovalQueue from '../components/ApprovalQueue'
import ProtectedRoute from '../components/ProtectedRoute'

export default function ApprovalPage() {
  return (
    <ProtectedRoute allowedRoles={['approver', 'admin']}>
      <Layout>
        <ApprovalQueue />
      </Layout>
    </ProtectedRoute>
  )
}
