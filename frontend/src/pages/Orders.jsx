import React, { useEffect, useState, useCallback } from 'react'
import { getOrders, createOrder, deleteOrder, getCustomers, getProducts } from '../services/api'
import Modal from '../components/Modal'
import Alert from '../components/Alert'

const EMPTY_ITEM = { product_id: '', quantity: '' }

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // 'create' | 'detail' | 'delete'
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ customer_id: '', items: [{ ...EMPTY_ITEM }] })
  const [errors, setErrors] = useState({})
  const [alert, setAlert] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    getOrders()
      .then((r) => setOrders(r.data))
      .catch((e) => showAlert('error', e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
    getCustomers().then((r) => setCustomers(r.data)).catch(() => {})
    getProducts().then((r) => setProducts(r.data)).catch(() => {})
  }, [load])

  function showAlert(type, message) {
    setAlert({ type, message })
    setTimeout(() => setAlert(null), 5000)
  }

  function openCreate() {
    setForm({ customer_id: '', items: [{ ...EMPTY_ITEM }] })
    setErrors({})
    setModal('create')
  }

  function openDetail(o) { setSelected(o); setModal('detail') }
  function openDelete(o) { setSelected(o); setModal('delete') }
  function closeModal() { setModal(null); setSelected(null); setErrors({}) }

  // Order items form helpers
  function updateItem(index, field, value) {
    setForm((f) => {
      const items = [...f.items]
      items[index] = { ...items[index], [field]: value }
      return { ...f, items }
    })
  }

  function addItem() {
    setForm((f) => ({ ...f, items: [...f.items, { ...EMPTY_ITEM }] }))
  }

  function removeItem(index) {
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== index) }))
  }

  function calcPreviewTotal() {
    return form.items.reduce((sum, item) => {
      const p = products.find((x) => String(x.id) === String(item.product_id))
      if (!p || !item.quantity) return sum
      return sum + Number(p.price) * Number(item.quantity)
    }, 0)
  }

  function validate() {
    const errs = {}
    if (!form.customer_id) errs.customer_id = 'Select a customer'
    form.items.forEach((item, i) => {
      if (!item.product_id) errs[`item_product_${i}`] = 'Select a product'
      if (!item.quantity || Number(item.quantity) <= 0) errs[`item_qty_${i}`] = 'Enter a valid quantity'
    })
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSubmitting(true)
    const payload = {
      customer_id: Number(form.customer_id),
      items: form.items.map((i) => ({ product_id: Number(i.product_id), quantity: Number(i.quantity) })),
    }
    try {
      await createOrder(payload)
      showAlert('success', 'Order created successfully')
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
      await deleteOrder(selected.id)
      showAlert('success', 'Order cancelled and stock restored')
      closeModal(); load()
    } catch (err) {
      showAlert('error', err.message)
      closeModal()
    } finally {
      setSubmitting(false)
    }
  }

  function statusBadge(status) {
    const map = { pending: 'badge-info', completed: 'badge-success', cancelled: 'badge-danger' }
    return <span className={`badge ${map[status] || 'badge-neutral'}`}>{status}</span>
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Orders</h2>
          <p>Track and manage customer orders</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Create Order</button>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="card">
        <div className="card-header">
          <h3>All Orders <span className="badge badge-neutral" style={{ marginLeft: 8 }}>{orders.length}</span></h3>
        </div>
        <div className="table-wrapper">
          {loading ? (
            <div className="loading"><div className="spinner" /></div>
          ) : orders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🛒</div>
              <h4>No orders yet</h4>
              <p>Click "Create Order" to place your first order</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="fw-600">#{o.id}</td>
                    <td>{o.customer?.full_name || `Customer #${o.customer_id}`}</td>
                    <td>{o.items?.length || 0} item(s)</td>
                    <td className="fw-600">${Number(o.total_amount).toFixed(2)}</td>
                    <td>{statusBadge(o.status)}</td>
                    <td className="text-muted">{new Date(o.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-ghost btn-sm" onClick={() => openDetail(o)}>👁 View</button>
                        <button className="btn btn-danger btn-sm" onClick={() => openDelete(o)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Order Modal */}
      <Modal isOpen={modal === 'create'} onClose={closeModal} title="Create New Order" size="modal-lg">
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {errors._global && <Alert type="error" message={errors._global} />}
            <div className="form-group">
              <label className="form-label">Customer *</label>
              <select
                className={`form-control${errors.customer_id ? ' error' : ''}`}
                value={form.customer_id}
                onChange={(e) => { setForm((f) => ({ ...f, customer_id: e.target.value })); setErrors((er) => ({ ...er, customer_id: undefined })) }}
              >
                <option value="">— Select a customer —</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>)}
              </select>
              {errors.customer_id && <div className="form-error">{errors.customer_id}</div>}
            </div>

            <div className="items-builder">
              <div className="items-builder-header">
                <span>Order Items</span>
                <button type="button" className="btn btn-ghost btn-sm" onClick={addItem}>+ Add Item</button>
              </div>
              {form.items.map((item, i) => (
                <div className="item-row" key={i}>
                  <div className="form-group">
                    <label className="form-label">Product</label>
                    <select
                      className={`form-control${errors[`item_product_${i}`] ? ' error' : ''}`}
                      value={item.product_id}
                      onChange={(e) => { updateItem(i, 'product_id', e.target.value); setErrors((er) => ({ ...er, [`item_product_${i}`]: undefined })) }}
                    >
                      <option value="">— Select product —</option>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.name} (Stock: {p.quantity}) — ${Number(p.price).toFixed(2)}</option>)}
                    </select>
                    {errors[`item_product_${i}`] && <div className="form-error">{errors[`item_product_${i}`]}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Qty</label>
                    <input
                      className={`form-control${errors[`item_qty_${i}`] ? ' error' : ''}`}
                      type="number" min="1" value={item.quantity}
                      onChange={(e) => { updateItem(i, 'quantity', e.target.value); setErrors((er) => ({ ...er, [`item_qty_${i}`]: undefined })) }}
                      placeholder="1"
                    />
                    {errors[`item_qty_${i}`] && <div className="form-error">{errors[`item_qty_${i}`]}</div>}
                  </div>
                  {form.items.length > 1 && (
                    <button type="button" className="btn btn-danger btn-icon btn-sm" onClick={() => removeItem(i)} style={{ alignSelf: 'flex-end', marginBottom: 0 }}>✕</button>
                  )}
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'right', padding: '8px 0' }}>
              <span className="text-muted">Estimated Total: </span>
              <strong style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>${calcPreviewTotal().toFixed(2)}</strong>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Placing Order…' : 'Place Order'}</button>
          </div>
        </form>
      </Modal>

      {/* Order Detail Modal */}
      <Modal isOpen={modal === 'detail'} onClose={closeModal} title={`Order #${selected?.id} Details`} size="modal-lg">
        {selected && (
          <>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <div className="text-muted" style={{ fontSize: '0.78rem', marginBottom: '4px' }}>CUSTOMER</div>
                  <div className="fw-600">{selected.customer?.full_name}</div>
                  <div className="text-muted">{selected.customer?.email}</div>
                  <div className="text-muted">{selected.customer?.phone}</div>
                </div>
                <div>
                  <div className="text-muted" style={{ fontSize: '0.78rem', marginBottom: '4px' }}>ORDER INFO</div>
                  <div><span className="text-muted">Status: </span>{statusBadge(selected.status)}</div>
                  <div style={{ marginTop: '4px' }}><span className="text-muted">Date: </span>{new Date(selected.created_at).toLocaleString()}</div>
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <div className="text-muted" style={{ fontSize: '0.78rem', marginBottom: '8px' }}>ORDER ITEMS</div>
                <ul className="order-items-list">
                  {selected.items?.map((item) => (
                    <li key={item.id}>
                      <span>
                        <span className="fw-600">{item.product?.name || `Product #${item.product_id}`}</span>
                        <span className="text-muted" style={{ marginLeft: '8px' }}>× {item.quantity}</span>
                      </span>
                      <span className="fw-600">${(Number(item.unit_price) * item.quantity).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div style={{ textAlign: 'right', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                <span className="text-muted">Total Amount: </span>
                <strong style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>${Number(selected.total_amount).toFixed(2)}</strong>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={closeModal}>Close</button>
              <button className="btn btn-danger" onClick={() => { closeModal(); openDelete(selected) }}>Cancel Order</button>
            </div>
          </>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={modal === 'delete'} onClose={closeModal} title="Cancel Order">
        <div className="modal-body">
          <p>Cancel order <strong>#{selected?.id}</strong>? This will restore the stock for all items in this order.</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={closeModal}>Keep Order</button>
          <button className="btn btn-danger" onClick={handleDelete} disabled={submitting}>{submitting ? 'Cancelling…' : 'Cancel Order'}</button>
        </div>
      </Modal>
    </div>
  )
}
