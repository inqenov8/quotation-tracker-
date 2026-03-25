import { Routes, Route } from 'react-router-dom'
import Layout from '../components/Layout'
import QuoteList from '../components/QuoteList'
import QuoteForm from '../components/QuoteForm'
import QuoteDetail from '../components/QuoteDetail'
import ProtectedRoute from '../components/ProtectedRoute'

export default function QuotesPage() {
  return (
    <Layout>
      <Routes>
        <Route index element={<QuoteList />} />
        <Route path="new" element={
          <ProtectedRoute allowedRoles={['submitter', 'admin']}>
            <QuoteForm onSuccess={() => window.history.back()} />
          </ProtectedRoute>
        } />
        <Route path=":id" element={<QuoteDetail />} />
        <Route path=":id/edit" element={
          <ProtectedRoute allowedRoles={['submitter', 'admin']}>
            <QuoteForm quoteId={':id'} onSuccess={() => window.history.back()} />
          </ProtectedRoute>
        } />
      </Routes>
    </Layout>
  )
}
