import React, { useEffect, useState, useCallback } from 'react'
import { getProducts, createProduct, updateProduct, deleteProduct } from '../services/api'
import Modal from '../components/Modal'
import Alert from '../components/Alert'

const EMPTY_FORM = { name: '', sku: '', price: '', quantity: '', description: '' }

function validate(form) {
  const errors = {}
  if (!form.name.trim()) errors.name = 'Name is required'
  if (!form.sku.trim()) errors.sku = 'SKU is required'
  if (!form.price || isNaN(form.price) || Number(form.price) <= 0) errors.price = 'Enter a valid positive price'
  if (form.quantity === '' || isNaN(form.quantity) || Number(form.quantity) < 0) errors.quantity = 'Quantity cannot be negative'
  return errors
}

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // 'add' | 'edit' | 'delete'
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [alert, setAlert] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    getProducts()
      .then((r) => setProducts(r.data))
      .catch((e) => showAlert('error', e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  function showAlert(type, message) {
    setAlert({ type, message })
    setTimeout(() => setAlert(null), 4000)
  }

  function openAdd() {
    setForm(EMPTY_FORM); setErrors({}); setModal('add')
  }

  function openEdit(p) {
    setSelected(p)
    setForm({ name: p.name, sku: p.sku, price: String(p.price), quantity: String(p.quantity), description: p.description || '' })
    setErrors({})
    setModal('edit')
  }

  function openDelete(p) { setSelected(p); setModal('delete') }

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
    const payload = { name: form.name.trim(), sku: form.sku.trim(), price: Number(form.price), quantity: Number(form.quantity), description: form.description.trim() || null }
    try {
      if (modal === 'add') {
        await createProduct(payload)
        showAlert('success', 'Product created successfully')
      } else {
        await updateProduct(selected.id, payload)
        showAlert('success', 'Product updated successfully')
      }
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
      await deleteProduct(selected.id)
      showAlert('success', 'Product deleted successfully')
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
          <h2>Products</h2>
          <p>Manage your product catalog and inventory</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Product</button>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="card">
        <div className="card-header">
          <h3>All Products <span className="badge badge-neutral" style={{ marginLeft: 8 }}>{products.length}</span></h3>
        </div>
        <div className="table-wrapper">
          {loading ? (
            <div className="loading"><div className="spinner" /></div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <h4>No products yet</h4>
              <p>Click "Add Product" to create your first product</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product Name</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="text-muted">{p.id}</td>
                    <td>
                      <div className="fw-600">{p.name}</div>
                      {p.description && <div className="text-muted" style={{ fontSize: '0.78rem' }}>{p.description}</div>}
                    </td>
                    <td><span className="sku-tag">{p.sku}</span></td>
                    <td className="fw-600">${Number(p.price).toFixed(2)}</td>
                    <td>{p.quantity}</td>
                    <td>
                      <span className={`badge ${p.quantity === 0 ? 'badge-danger' : p.quantity < 10 ? 'badge-warning' : 'badge-success'}`}>
                        {p.quantity === 0 ? 'Out of Stock' : p.quantity < 10 ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>✏️ Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => openDelete(p)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal isOpen={modal === 'add' || modal === 'edit'} onClose={closeModal} title={modal === 'add' ? 'Add New Product' : 'Edit Product'}>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {errors._global && <Alert type="error" message={errors._global} />}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input className={`form-control${errors.name ? ' error' : ''}`} name="name" value={form.name} onChange={handleChange} placeholder="e.g. Wireless Mouse" />
                {errors.name && <div className="form-error">{errors.name}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">SKU / Code *</label>
                <input className={`form-control${errors.sku ? ' error' : ''}`} name="sku" value={form.sku} onChange={handleChange} placeholder="e.g. WM-001" />
                {errors.sku && <div className="form-error">{errors.sku}</div>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Price ($) *</label>
                <input className={`form-control${errors.price ? ' error' : ''}`} name="price" type="number" step="0.01" min="0.01" value={form.price} onChange={handleChange} placeholder="0.00" />
                {errors.price && <div className="form-error">{errors.price}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Quantity *</label>
                <input className={`form-control${errors.quantity ? ' error' : ''}`} name="quantity" type="number" min="0" value={form.quantity} onChange={handleChange} placeholder="0" />
                {errors.quantity && <div className="form-error">{errors.quantity}</div>}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-control" name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Optional product description" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving…' : modal === 'add' ? 'Create Product' : 'Save Changes'}</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={modal === 'delete'} onClose={closeModal} title="Delete Product">
        <div className="modal-body">
          <p>Are you sure you want to delete <strong>{selected?.name}</strong>? This action cannot be undone.</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
          <button className="btn btn-danger" onClick={handleDelete} disabled={submitting}>{submitting ? 'Deleting…' : 'Delete Product'}</button>
        </div>
      </Modal>
    </div>
  )
}
