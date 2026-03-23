import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const initialForm = {
  name: '',
  category: 'Phone',
  price: '',
  image: '',
  stock: '',
}

function App() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [formData, setFormData] = useState(initialForm)
  const [editingId, setEditingId] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [detailProduct, setDetailProduct] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const api = useMemo(() => axios.create({ baseURL: API_BASE_URL }), [])

  const categories = useMemo(() => {
    const unique = new Set(products.map((item) => item.category))
    return ['All', ...unique]
  }, [products])

  const stats = useMemo(() => {
    const totalStock = products.reduce((sum, item) => sum + item.stock, 0)
    const totalValue = products.reduce((sum, item) => sum + item.price * item.stock, 0)
    return {
      totalProducts: products.length,
      totalStock,
      totalValue,
    }
  }, [products])

  const loadProducts = async () => {
    setLoading(true)
    setError('')

    try {
      const params = {}
      if (category !== 'All') {
        params.category = category
      }
      if (search.trim()) {
        params.search = search.trim()
      }

      const response = await api.get('/products', { params })
      setProducts(response.data)
      setSelectedProduct((current) => {
        if (!response.data.length) {
          return null
        }

        if (!current) {
          return response.data[0]
        }

        return response.data.find((item) => item.id === current.id) || response.data[0]
      })
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Khong tai duoc danh sach san pham')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [category, api])

  const handleSearchSubmit = async (event) => {
    event.preventDefault()
    await loadProducts()
  }

  const handleInputChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const resetForm = () => {
    setFormData(initialForm)
    setEditingId(null)
  }

  const handleEdit = (product) => {
    setEditingId(product.id)
    setFormData({
      name: product.name,
      category: product.category,
      price: String(product.price),
      image: product.image,
      stock: String(product.stock),
    })
  }

  const handleDelete = async (id) => {
    setMessage('')
    setError('')

    try {
      await api.delete(`/products/${id}`)
      setMessage('Xoa san pham thanh cong')
      await loadProducts()

      if (editingId === id) {
        resetForm()
      }
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Khong the xoa san pham')
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')
    setError('')

    const payload = {
      ...formData,
      price: Number(formData.price),
      stock: Number(formData.stock),
    }

    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, payload)
        setMessage('Cap nhat san pham thanh cong')
      } else {
        await api.post('/products', payload)
        setMessage('Them san pham thanh cong')
      }

      resetForm()
      await loadProducts()
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Khong the luu san pham')
    }
  }

  return (
    <div className="page">
      <div className="app-header">
        <div className="header-content">
          <h1>ElectroHub</h1>
          <p>Quản lý sản phẩm tối ưu</p>
        </div>
      </div>

      <section className="toolbar panel">
        <form className="search-form" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            placeholder="🔍 Tìm sản phẩm..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button type="submit">Tìm kiếm</button>
        </form>

        <div className="controls">
          <label htmlFor="category">Danh mục</label>
          <select
            id="category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="layout">
        <article className="panel form-panel">
          <div className="section-head">
            <div>
              <p className="section-kicker">Workspace</p>
              <h2>{editingId ? 'Cap nhat san pham' : 'Them san pham'}</h2>
            </div>
            <span className="role-pill live">CRUD</span>
          </div>

          <form className="product-form" onSubmit={handleSubmit}>
            <input name="name" placeholder="Ten san pham" value={formData.name} onChange={handleInputChange} />
            <input name="category" placeholder="Danh muc" value={formData.category} onChange={handleInputChange} />
            <input name="price" type="number" min="0" step="1" placeholder="Gia" value={formData.price} onChange={handleInputChange} />
            <input name="image" placeholder="Image URL" value={formData.image} onChange={handleInputChange} />
            <input name="stock" type="number" min="0" step="1" placeholder="Ton kho" value={formData.stock} onChange={handleInputChange} />

            <div className="form-actions">
              <button type="submit">{editingId ? 'Update' : 'Create'}</button>
              {editingId && (
                <button type="button" className="ghost" onClick={resetForm}>
                  Cancel
                </button>
              )}
            </div>
          </form>

          {message && <p className="ok">{message}</p>}
          {error && <p className="err">{error}</p>}
        </article>
      </section>

      <section className="panel list-panel">
        <div className="section-head">
          <div>
            <p className="section-kicker">Catalog</p>
            <h2>Danh sach san pham</h2>
          </div>
        </div>

        {loading ? (
          <p>Dang tai...</p>
        ) : (
          <div className="grid">
            {products.map((product) => (
              <div className={`card ${selectedProduct?.id === product.id ? 'selected' : ''}`} key={product.id}>
                <img src={product.image} alt={product.name} loading="lazy" />
                <div className="card-body">
                  <p className="mini-tag">#{product.id} · {product.category}</p>
                  <h3>{product.name}</h3>
                  <p className="price">${product.price.toLocaleString()}</p>
                  <p>Stock: {product.stock}</p>
                </div>
                <div className="card-actions">
                  <button onClick={() => setDetailProduct(product)}>View</button>
                  <button onClick={() => handleEdit(product)}>Edit</button>
                  <button className="danger" onClick={() => handleDelete(product.id)}>Delete</button>
                </div>
              </div>
            ))}
            {products.length === 0 && <p>Khong co du lieu phu hop.</p>}
          </div>
        )}
      </section>

      {detailProduct && (
        <div className="modal-overlay" onClick={() => setDetailProduct(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setDetailProduct(null)}>×</button>
            <div className="modal-body">
              <img src={detailProduct.image} alt={detailProduct.name} className="modal-image" />
              <div className="modal-info">
                <h2>{detailProduct.name}</h2>
                <div className="detail-row">
                  <span className="label">ID:</span>
                  <span className="value">#{detailProduct.id}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Danh mục:</span>
                  <span className="value">{detailProduct.category}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Giá:</span>
                  <span className="value price-large">${detailProduct.price.toLocaleString()}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Tồn kho:</span>
                  <span className="value">{detailProduct.stock} sản phẩm</span>
                </div>
                <div className="modal-actions">
                  <button onClick={() => {
                    handleEdit(detailProduct)
                    setDetailProduct(null)
                  }}>Edit</button>
                  <button className="danger" onClick={() => {
                    handleDelete(detailProduct.id)
                    setDetailProduct(null)
                  }}>Delete</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
