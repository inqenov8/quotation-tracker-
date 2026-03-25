import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function DispatchForm({ quote, onClose, onSuccess }) {
  const { profile } = useAuth()
  const [formData, setFormData] = useState({
    dispatched_to: '',
    recipient_role: '',
    dispatch_method: 'Email',
    quote_version: 'v1.0',
    validity_days: 30,
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const dispatchData = {
        quote_id: quote.id,
        customer: quote.customer,
        approved_by: quote.approved_by,
        approval_date: quote.approval_date,
        dispatched_by: profile.id,
        dispatch_date: new Date().toISOString().slice(0,10),
        sent_to_name: formData.dispatched_to,
        recipient_role: formData.recipient_role,
        dispatch_method: formData.dispatch_method,
        quote_version: formData.quote_version,
        validity_days: formData.validity_days,
        notes: formData.notes,
      }
      await supabase.from('dispatch_log').insert(dispatchData)

      await supabase
        .from('quotes')
        .update({
          quote_status: 'Dispatched',
          dispatched_to: formData.dispatched_to,
          date_dispatched: new Date().toISOString().slice(0,10),
        })
        .eq('id', quote.id)

      toast.success('Quote dispatched')
      onSuccess()
      onClose()
    } catch (err) {
      toast.error('Error recording dispatch')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Dispatch Quote</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium">Sent To (Name)</label>
            <input type="text" required value={formData.dispatched_to} onChange={e => setFormData({...formData, dispatched_to: e.target.value})} className="mt-1 block w-full border rounded-md p-2" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium">Recipient Role</label>
            <input type="text" value={formData.recipient_role} onChange={e => setFormData({...formData, recipient_role: e.target.value})} className="mt-1 block w-full border rounded-md p-2" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium">Dispatch Method</label>
            <select value={formData.dispatch_method} onChange={e => setFormData({...formData, dispatch_method: e.target.value})} className="mt-1 block w-full border rounded-md p-2">
              <option>Email</option>
              <option>Portal</option>
              <option>In Person</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium">Quote Version</label>
            <input type="text" value={formData.quote_version} onChange={e => setFormData({...formData, quote_version: e.target.value})} className="mt-1 block w-full border rounded-md p-2" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium">Validity (Days)</label>
            <input type="number" value={formData.validity_days} onChange={e => setFormData({...formData, validity_days: parseInt(e.target.value)})} className="mt-1 block w-full border rounded-md p-2" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium">Notes</label>
            <textarea rows="3" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="mt-1 block w-full border rounded-md p-2"></textarea>
          </div>
          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
            <button type="submit" disabled={submitting} className="bg-blue-600 text-white px-4 py-2 rounded">Dispatch</button>
          </div>
        </form>
      </div>
    </div>
  )
}
