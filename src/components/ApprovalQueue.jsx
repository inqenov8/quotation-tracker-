import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function ApprovalQueue() {
  const { profile } = useAuth()
  const [pending, setPending] = useState([])

  useEffect(() => {
    fetchPending()
  }, [])

  const fetchPending = async () => {
    const { data, error } = await supabase
      .from('approval_requests')
      .select(`
        id,
        quote_id,
        customer,
        product_pillar,
        scope_summary,
        vendor_cost,
        quoted_price,
        gross_margin,
        margin_pct,
        date_submitted,
        submitted_by,
        quotes!inner(id)
      `)
      .eq('decision', 'Pending Approval')
    if (!error) setPending(data)
  }

  const handleDecision = async (approvalId, quoteId, decision, comments) => {
    try {
      // Update approval_requests
      await supabase
        .from('approval_requests')
        .update({
          decision,
          conditions_comments: comments,
          approver: profile.id,
          date_reviewed: new Date().toISOString().slice(0,10),
        })
        .eq('id', approvalId)

      // Update quote
      const newStatus = decision === 'Approved' ? 'Approved — Dispatch Ready' : (decision === 'Revision Requested' ? 'Revise & Resubmit' : 'Rejected')
      await supabase
        .from('quotes')
        .update({
          quote_status: newStatus,
          approval_decision: decision,
          approved_by: profile.name,
          approval_date: new Date().toISOString().slice(0,10),
        })
        .eq('id', quoteId)

      toast.success(`Quote ${decision.toLowerCase()}`)
      fetchPending()
    } catch (err) {
      toast.error('Error updating approval')
    }
  }

  if (pending.length === 0) return <div className="text-center">No pending approvals.</div>

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Pending Approvals</h2>
      <div className="space-y-4">
        {pending.map(req => (
          <div key={req.id} className="bg-white p-4 rounded shadow">
            <h3 className="text-lg font-semibold">{req.quote_id} – {req.customer}</h3>
            <p>Product: {req.product_pillar}</p>
            <p>Scope: {req.scope_summary}</p>
            <p>Quoted: ₦{req.quoted_price?.toLocaleString()}</p>
            <p>Margin: {(req.margin_pct * 100).toFixed(2)}%</p>
            <div className="mt-2 space-x-2">
              <button onClick={() => handleDecision(req.id, req.quotes.id, 'Approved', '')} className="bg-green-600 text-white px-3 py-1 rounded">Approve</button>
              <button onClick={() => {
                const comments = prompt('Comments for revision:')
                if (comments) handleDecision(req.id, req.quotes.id, 'Revision Requested', comments)
              }} className="bg-yellow-600 text-white px-3 py-1 rounded">Request Revision</button>
              <button onClick={() => {
                const reason = prompt('Reason for rejection:')
                if (reason) handleDecision(req.id, req.quotes.id, 'Rejected', reason)
              }} className="bg-red-600 text-white px-3 py-1 rounded">Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
