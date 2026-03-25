import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function QuoteList() {
  const { profile } = useAuth()
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQuotes()
  }, [])

  const fetchQuotes = async () => {
    setLoading(true)
    let query = supabase.from('quotes').select('*')
    if (profile?.role === 'submitter') {
      query = query.eq('created_by', profile.id)
    }
    const { data, error } = await query.order('created_at', { ascending: false })
    if (!error) setQuotes(data)
    setLoading(false)
  }

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Quotes</h2>
        <Link to="/quotes/new" className="bg-indigo-600 text-white px-4 py-2 rounded">+ New Quote</Link>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Quote ID</th>
              <th className="border p-2">Customer</th>
              <th className="border p-2">Product Pillar</th>
              <th className="border p-2">Opportunity Value (₦)</th>
              <th className="border p-2">Status</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map(q => (
              <tr key={q.id}>
                <td className="border p-2">{q.quote_id}</td>
                <td className="border p-2">{q.customer}</td>
                <td className="border p-2">{q.product_pillar}</td>
                <td className="border p-2 text-right">{q.opportunity_value?.toLocaleString()}</td>
                <td className="border p-2">{q.quote_status}</td>
                <td className="border p-2">
                  <Link to={`/quotes/${q.id}`} className="text-blue-600 mr-2">View</Link>
                  {(q.quote_status === 'Pricing In Progress' || q.quote_status === 'Revise & Resubmit') && (
                    <Link to={`/quotes/${q.id}/edit`} className="text-green-600">Edit</Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
