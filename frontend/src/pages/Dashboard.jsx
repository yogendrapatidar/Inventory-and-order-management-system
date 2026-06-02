import React, { useEffect, useState } from 'react'
import { getDashboard } from '../services/api'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getDashboard()
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading"><div className="spinner" /></div>
  if (error) return <div className="alert alert-error">{error}</div>

  const stats = [
    { label: 'Total Products', value: data.total_products, icon: '📦', color: 'indigo' },
    { label: 'Total Customers', value: data.total_customers, icon: '👥', color: 'cyan' },
    { label: 'Total Orders', value: data.total_orders, icon: '🛒', color: 'green' },
    { label: 'Low Stock Items', value: data.low_stock_count, icon: '⚠️', color: 'amber' },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p>Overview of your inventory and orders</p>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((s) => (
          <div className="stat-card" key={s.label}>
            <div className={`stat-icon ${s.color}`}>{s.icon}</div>
            <div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <h3>⚠️ Low Stock Products <span className="badge badge-warning" style={{ marginLeft: 8 }}>{data.low_stock_count}</span></h3>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {data.low_stock_products.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✅</div>
              <h4>All products are well stocked</h4>
              <p>No products below the low stock threshold (10 units)</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>SKU</th>
                    <th>Quantity</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.low_stock_products.map((p) => (
                    <tr key={p.id}>
                      <td className="fw-600">{p.name}</td>
                      <td><span className="sku-tag">{p.sku}</span></td>
                      <td>{p.quantity}</td>
                      <td>
                        <span className={`badge ${p.quantity === 0 ? 'badge-danger' : 'badge-warning'}`}>
                          {p.quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
