import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const [kpis, setKpis] = useState({
    total: 0,
    pendingApproval: 0,
    pricingInProgress: 0,
    dispatchedThisMonth: 0,
  })
  const [pillars, setPillars] = useState([])

  useEffect(() => {
    fetchKPIs()
    fetchPillars()
  }, [])

  const fetchKPIs = async () => {
    const { count: total } = await supabase.from('quotes').select('*', { count: 'exact', head: true })
    const { count: pending } = await supabase.from('quotes').select('*', { count: 'exact', head: true }).eq('quote_status', 'Pending Approval')
    const { count: pricing } = await supabase.from('quotes').select('*', { count: 'exact', head: true }).eq('quote_status', 'Pricing In Progress')
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10)
    const { count: dispatched } = await supabase.from('quotes').select('*', { count: 'exact', head: true }).gte('date_dispatched', startOfMonth)
    setKpis({ total, pendingApproval: pending, pricingInProgress: pricing, dispatchedThisMonth: dispatched })
  }

  const fetchPillars = async () => {
    const { data, error } = await supabase
      .from('quotes')
      .select('product_pillar, quote_status, opportunity_value')
    if (error) return
    // Group by pillar
    const grouped = data.reduce((acc, row) => {
      const pillar = row.product_pillar
      if (!acc[pillar]) acc[pillar] = { total: 0, pending: 0, inProgress: 0, dispatched: 0, value: 0 }
      acc[pillar].total += 1
      if (row.quote_status === 'Pending Approval') acc[pillar].pending += 1
      if (row.quote_status === 'Pricing In Progress') acc[pillar].inProgress += 1
      if (row.quote_status === 'Dispatched') acc[pillar].dispatched += 1
      acc[pillar].value += (row.opportunity_value || 0)
      return acc
    }, {})
    setPillars(Object.entries(grouped).map(([name, stats]) => ({ name, ...stats })))
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-500">Total Quotes</p>
          <p className="text-2xl font-bold">{kpis.total}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-500">Pending Approval</p>
          <p className="text-2xl font-bold">{kpis.pendingApproval}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-500">Pricing In Progress</p>
          <p className="text-2xl font-bold">{kpis.pricingInProgress}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-500">Dispatched This Month</p>
          <p className="text-2xl font-bold">{kpis.dispatchedThisMonth}</p>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4">Quotes by Product Pillar</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Product Pillar</th>
              <th className="border p-2">Total</th>
              <th className="border p-2">In Progress</th>
              <th className="border p-2">Pending Approval</th>
              <th className="border p-2">Dispatched</th>
              <th className="border p-2">Total Pipeline Value (₦)</th>
            </tr>
          </thead>
          <tbody>
            {pillars.map(p => (
              <tr key={p.name}>
                <td className="border p-2">{p.name}</td>
                <td className="border p-2 text-center">{p.total}</td>
                <td className="border p-2 text-center">{p.inProgress || 0}</td>
                <td className="border p-2 text-center">{p.pending || 0}</td>
                <td className="border p-2 text-center">{p.dispatched || 0}</td>
                <td className="border p-2 text-right">{p.value.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
