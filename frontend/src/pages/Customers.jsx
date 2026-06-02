import React, { useEffect, useState, useCallback } from 'react'
import { getCustomers, createCustomer, deleteCustomer } from '../services/api'
import Modal from '../components/Modal'
import Alert from '../components/Alert'

const EMPTY_FORM = { full_name: '', email: '', phone: '' }

function validate(form) {
  const errors = {}
  if (!form.full_name.trim()) errors.full_name = 'Full name is required'
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!form.email.trim() || !emailRe.test(form.email)) errors.email = 'Enter a valid email address'
  if (!form.phone.trim() || form.phone.trim().length < 7) errors.phone = 'Enter a valid phone number'
  return errors
}

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [alert, setAlert] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    getCustomers()
      .then((r) => setCustomers(r.data))
      .catch((e) => showAlert('error', e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  function showAlert(type, message) {
    setAlert({ type, message })
    setTimeout(() => setAlert(null), 4000)
  }

  function openAdd() { setForm(EMPTY_FORM); setErrors({}); setModal('add') }
  function openDelete(c) { setSelected(c); setModal('delete') }
  function closeModal() { setModal(null); setSelected(null); setErrors({}) }

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setErrors((er) => ({ ...er, [e.target.name]: undefined }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSubmitting(true)
    try {
      await createCustomer({ full_name: form.full_name.trim(), email: form.email.trim(), phone: form.phone.trim() })
      showAlert('success', 'Customer added successfully')
      closeModal(); load()
    } catch (err) {
      setErrors({ _global: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    setSubmitting(true)
    try {
      await deleteCustomer(selected.id)
      showAlert('success', 'Customer deleted successfully')
      closeModal(); load()
    } catch (err) {
      showAlert('error', err.message)
      closeModal()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Customers</h2>
          <p>Manage your customer directory</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Customer</button>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="card">
        <div className="card-header">
          <h3>All Customers <span className="badge badge-neutral" style={{ marginLeft: 8 }}>{customers.length}</span></h3>
        </div>
        <div className="table-wrapper">
          {loading ? (
            <div className="loading"><div className="spinner" /></div>
          ) : customers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <h4>No customers yet</h4>
              <p>Click "Add Customer" to register your first customer</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td className="text-muted">{c.id}</td>
                    <td className="fw-600">{c.full_name}</td>
                    <td>{c.email}</td>
                    <td>{c.phone}</td>
                    <td className="text-muted">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => openDelete(c)}>🗑️ Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal isOpen={modal === 'add'} onClose={closeModal} title="Add New Customer">
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {errors._global && <Alert type="error" message={errors._global} />}
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className={`form-control${errors.full_name ? ' error' : ''}`} name="full_name" value={form.full_name} onChange={handleChange} placeholder="e.g. Jane Doe" />
              {errors.full_name && <div className="form-error">{errors.full_name}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input className={`form-control${errors.email ? ' error' : ''}`} name="email" type="email" value={form.email} onChange={handleChange} placeholder="e.g. jane@example.com" />
              {errors.email && <div className="form-error">{errors.email}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input className={`form-control${errors.phone ? ' error' : ''}`} name="phone" value={form.phone} onChange={handleChange} placeholder="e.g. +1 555 0100" />
              {errors.phone && <div className="form-error">{errors.phone}</div>}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving…' : 'Add Customer'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={modal === 'delete'} onClose={closeModal} title="Delete Customer">
        <div className="modal-body">
          <p>Are you sure you want to delete <strong>{selected?.full_name}</strong>? This action cannot be undone and will affect related orders.</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
          <button className="btn btn-danger" onClick={handleDelete} disabled={submitting}>{submitting ? 'Deleting…' : 'Delete Customer'}</button>
        </div>
      </Modal>
    </div>
  )
}
