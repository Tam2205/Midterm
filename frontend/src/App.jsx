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
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const categories = useMemo(() => {
    const unique = new Set(products.map((item) => item.category))
    return ['All', ...unique]
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

      const response = await axios.get(`${API_BASE_URL}/products`, { params })
      setProducts(response.data)
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Khong tai duoc danh sach san pham')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [category])

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
      await axios.delete(`${API_BASE_URL}/products/${id}`)
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
        await axios.put(`${API_BASE_URL}/products/${editingId}`, payload)
        setMessage('Cap nhat san pham thanh cong')
      } else {
        await axios.post(`${API_BASE_URL}/products`, payload)
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
      <header className="top">
        <div>
          <p className="tag">React + Express + MongoDB</p>
          <h1>Product Manager</h1>
        </div>

        <form className="search-form" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            placeholder="Tim san pham..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button type="submit">Search</button>
        </form>
      </header>

      <section className="controls">
        <label htmlFor="category">Category</label>
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
      </section>

      <section className="layout">
        <article className="panel form-panel">
          <h2>{editingId ? 'Cap nhat san pham' : 'Them san pham'}</h2>
          <form className="product-form" onSubmit={handleSubmit}>
            <input name="name" placeholder="Ten" value={formData.name} onChange={handleInputChange} />
            <input name="category" placeholder="Category" value={formData.category} onChange={handleInputChange} />
            <input name="price" type="number" min="0" step="1" placeholder="Price" value={formData.price} onChange={handleInputChange} />
            <input name="image" placeholder="Image URL" value={formData.image} onChange={handleInputChange} />
            <input name="stock" type="number" min="0" step="1" placeholder="Stock" value={formData.stock} onChange={handleInputChange} />

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

        <article className="panel list-panel">
          <h2>Danh sach san pham</h2>
          {loading ? (
            <p>Dang tai...</p>
          ) : (
            <div className="grid">
              {products.map((product) => (
                <div className="card" key={product.id}>
                  <img src={product.image} alt={product.name} loading="lazy" />
                  <div className="card-body">
                    <h3>{product.name}</h3>
                    <p>{product.category}</p>
                    <p>${product.price}</p>
                    <p>Stock: {product.stock}</p>
                  </div>
                  <div className="card-actions">
                    <button onClick={() => handleEdit(product)}>Edit</button>
                    <button className="danger" onClick={() => handleDelete(product.id)}>Delete</button>
                  </div>
                </div>
              ))}
              {products.length === 0 && <p>Khong co du lieu phu hop.</p>}
            </div>
          )}
        </article>
      </section>
    </div>
  )
}

export default App
