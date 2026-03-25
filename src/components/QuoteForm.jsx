import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function QuoteForm({ quoteId, onSuccess }) {
  const { profile } = useAuth()
  const [formData, setFormData] = useState({
    quote_id: '',
    date_received: new Date().toISOString().slice(0,10),
    customer: '',
    product_pillar: '',
    engagement_type: '',
    scope_description: '',
    // ... include all fields from schema
    quote_status: 'Pricing In Progress',
  })
  const [lines, setLines] = useState([])
  const [totals, setTotals] = useState({ vendorCost: 0, quotedPrice: 0, margin: 0, marginPct: 0 })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (quoteId) {
      // load quote and lines
    }
  }, [quoteId])

  const addLine = () => {
    setLines([...lines, {
      id: Date.now(),
      cost_item_desc: '',
      category: '',
      vendor_source: '',
      unit_cost: 0,
      qty: 1,
      markup_pct: 0,
      notes: '',
      include_in_total: true,
    }])
  }

  const updateLine = (idx, field, value) => {
    const newLines = [...lines]
    newLines[idx][field] = value
    if (['unit_cost', 'qty', 'markup_pct', 'include_in_total'].includes(field)) {
      recalcTotals(newLines)
    }
    setLines(newLines)
  }

  const recalcTotals = (currentLines) => {
    let vc = 0, qp = 0
    currentLines.forEach(line => {
      if (line.include_in_total) {
        const totalCost = (line.unit_cost || 0) * (line.qty || 0)
        const sellingPrice = totalCost * (1 + (line.markup_pct || 0))
        vc += totalCost
        qp += sellingPrice
      }
    })
    const margin = qp - vc
    const marginPct = qp ? margin / qp : 0
    setTotals({ vendorCost: vc, quotedPrice: qp, margin, marginPct })
  }

  const handleSubmit = async (e, submitForApproval = false) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const quoteData = {
        ...formData,
        vendor_cost: totals.vendorCost,
        quoted_price: totals.quotedPrice,
        submitted_for_approval: submitForApproval,
        quote_status: submitForApproval ? 'Pending Approval' : formData.quote_status,
        created_by: profile.id,
        updated_by: profile.id,
      }

      let savedQuote
      if (quoteId) {
        const { data, error } = await supabase
          .from('quotes')
          .update(quoteData)
          .eq('id', quoteId)
          .select()
          .single()
        if (error) throw error
        savedQuote = data
      } else {
        const { data, error } = await supabase
          .from('quotes')
          .insert(quoteData)
          .select()
          .single()
        if (error) throw error
        savedQuote = data
      }

      // Save lines
      if (quoteId) {
        await supabase.from('pricing_line_items').delete().eq('quote_id', quoteId)
      }
      const lineInserts = lines.map(line => ({
        quote_id: savedQuote.id,
        cost_item_desc: line.cost_item_desc,
        category: line.category,
        vendor_source: line.vendor_source,
        unit_cost: line.unit_cost,
        qty: line.qty,
        markup_pct: line.markup_pct,
        notes: line.notes,
        include_in_total: line.include_in_total,
        created_by: profile.id,
      }))
      const { error: lineError } = await supabase.from('pricing_line_items').insert(lineInserts)
      if (lineError) throw lineError

      if (submitForApproval) {
        const approvalData = {
          quote_id: savedQuote.id,
          date_submitted: new Date().toISOString().slice(0,10),
          submitted_by: profile.id,
          customer: formData.customer,
          product_pillar: formData.product_pillar,
          scope_summary: formData.scope_description,
          vendor_cost: totals.vendorCost,
          quoted_price: totals.quotedPrice,
          decision: 'Pending Approval',
          submission_notes: '',
        }
        await supabase.from('approval_requests').insert(approvalData)
        toast.success('Quote submitted for approval')
      } else {
        toast.success('Quote saved as draft')
      }

      onSuccess && onSuccess()
    } catch (err) {
      console.error(err)
      toast.error('Error saving quote')
    } finally {
      setSubmitting(false)
    }
  }

  // Return JSX with fields and table (see previous detailed example)
  return (
    <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
      {/* Include all form fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Quote ID</label>
          <input type="text" value={formData.quote_id} onChange={e => setFormData({...formData, quote_id: e.target.value})} required className="mt-1 block w-full border rounded-md p-2" />
        </div>
        {/* ... other fields */}
      </div>
      {/* Pricing table */}
      {/* Totals */}
      <div className="flex space-x-4">
        <button type="submit" disabled={submitting} className="bg-blue-600 text-white px-4 py-2 rounded">Save Draft</button>
        <button type="button" onClick={(e) => handleSubmit(e, true)} disabled={submitting} className="bg-green-600 text-white px-4 py-2 rounded">Submit for Approval</button>
      </div>
    </form>
  )
}
