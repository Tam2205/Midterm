import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const AUTH_STORAGE_KEY = 'midterm-auth'

const initialForm = {
  name: '',
  category: 'Phone',
  price: '',
  image: '',
  stock: '',
}

const initialLoginForm = {
  role: 'user',
  username: 'user',
  password: 'user123',
}

function App() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [auth, setAuth] = useState(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  })
  const [loginForm, setLoginForm] = useState(initialLoginForm)
  const [formData, setFormData] = useState(initialForm)
  const [editingId, setEditingId] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const api = useMemo(() => {
    const headers = auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}
    return axios.create({
      baseURL: API_BASE_URL,
      headers,
    })
  }, [auth?.token])

  const isAdmin = auth?.user?.role === 'admin'
  const currentRole = auth?.user?.role || 'guest'

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

  useEffect(() => {
    if (auth) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth))
      return
    }

    localStorage.removeItem(AUTH_STORAGE_KEY)
  }, [auth])

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

  const handleRolePresetChange = (role) => {
    setLoginForm({
      role,
      username: role === 'admin' ? 'admin' : 'user',
      password: role === 'admin' ? 'admin123' : 'user123',
    })
    setError('')
    setMessage('')
  }

  const handleLoginInputChange = (event) => {
    const { name, value } = event.target
    setLoginForm((current) => ({ ...current, [name]: value }))
  }

  const handleLogin = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, loginForm)
      setAuth(response.data)
      setMessage(`Dang nhap thanh cong voi quyen ${response.data.user.role}`)
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Dang nhap that bai')
    }
  }

  const handleLogout = () => {
    setAuth(null)
    resetForm()
    setMessage('Da dang xuat')
    setError('')
  }

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
    if (!isAdmin) {
      setError('User khong co quyen chinh sua san pham')
      return
    }

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
    if (!isAdmin) {
      setError('User khong co quyen xoa san pham')
      return
    }

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

    if (!isAdmin) {
      setError('User chi duoc xem danh sach san pham')
      return
    }

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
      <header className="hero-shell panel">
        <div className="hero-copy">
          <p className="tag">React + Express REST API + MongoDB</p>
          <h1>ElectroHub Control Room</h1>
          <p className="hero-text">
            Home duoc dung chung cho tat ca nguoi dung. Quyen thao tac chi duoc mo sau khi dang nhap voi vai tro admin hoac user.
          </p>

          <div className="hero-meta">
            <span className={`role-pill ${currentRole}`}>{currentRole}</span>
            <span className="hero-hint">Admin co CRUD, user chi xem va tim kiem.</span>
          </div>
        </div>

        <div className="hero-side">
          <div className="hero-stats">
            <div className="stat-card accent">
              <span>Products</span>
              <strong>{stats.totalProducts}</strong>
            </div>
            <div className="stat-card">
              <span>Total stock</span>
              <strong>{stats.totalStock}</strong>
            </div>
            <div className="stat-card">
              <span>Inventory value</span>
              <strong>${stats.totalValue.toLocaleString()}</strong>
            </div>
          </div>

          <div className="login-card">
            <div className="section-head compact">
              <div>
                <p className="section-kicker">Login</p>
                <h2>{auth ? auth.user.displayName : 'Dang nhap he thong'}</h2>
              </div>
            </div>

            {auth ? (
              <div className="session-box">
                <p>Tai khoan: <strong>{auth.user.username}</strong></p>
                <p>Vai tro: <strong>{auth.user.role}</strong></p>
                <button type="button" className="ghost full" onClick={handleLogout}>
                  Dang xuat
                </button>
              </div>
            ) : (
              <>
                <div className="role-tabs">
                  <button
                    type="button"
                    className={loginForm.role === 'admin' ? 'active' : ''}
                    onClick={() => handleRolePresetChange('admin')}
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    className={loginForm.role === 'user' ? 'active' : ''}
                    onClick={() => handleRolePresetChange('user')}
                  >
                    User
                  </button>
                </div>

                <form className="login-form" onSubmit={handleLogin}>
                  <input name="username" placeholder="Username" value={loginForm.username} onChange={handleLoginInputChange} />
                  <input name="password" type="password" placeholder="Password" value={loginForm.password} onChange={handleLoginInputChange} />
                  <button type="submit" className="full">Dang nhap</button>
                </form>

                <div className="demo-accounts">
                  <p>Admin: admin / admin123</p>
                  <p>User: user / user123</p>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="toolbar panel">
        <form className="search-form" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            placeholder="Tim san pham..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button type="submit">Search</button>
        </form>

        <div className="controls">
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
        </div>
      </section>

      <section className="layout">
        <article className="panel form-panel">
          <div className="section-head">
            <div>
              <p className="section-kicker">Workspace</p>
              <h2>{isAdmin ? (editingId ? 'Cap nhat san pham' : 'Them san pham') : 'Shared home'}</h2>
            </div>
            <span className={`role-pill ${currentRole}`}>{currentRole}</span>
          </div>

          {isAdmin ? (
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
          ) : (
            <div className="customer-note">
              <p>Trang home nay dung chung cho guest, user va admin.</p>
              <p>Chi sau khi dang nhap bang tai khoan admin moi mo CRUD. User va guest chi duoc xem, tim kiem va loc.</p>
            </div>
          )}

          {message && <p className="ok">{message}</p>}
          {error && <p className="err">{error}</p>}
        </article>

        <article className="panel spotlight-panel">
          <div className="section-head">
            <div>
              <p className="section-kicker">Featured</p>
              <h2>{selectedProduct ? selectedProduct.name : 'Chon mot san pham'}</h2>
            </div>
          </div>

          {selectedProduct ? (
            <div className="spotlight-card">
              <img src={selectedProduct.image} alt={selectedProduct.name} />
              <div className="spotlight-copy">
                <span className="badge">{selectedProduct.category}</span>
                <strong>${selectedProduct.price.toLocaleString()}</strong>
                <p>Con lai {selectedProduct.stock} san pham trong kho.</p>
              </div>
            </div>
          ) : (
            <p>Khong co san pham duoc chon.</p>
          )}
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
                    <button onClick={() => setSelectedProduct(product)}>View</button>
                    {isAdmin && <button onClick={() => handleEdit(product)}>Edit</button>}
                    {isAdmin && <button className="danger" onClick={() => handleDelete(product.id)}>Delete</button>}
                  </div>
                </div>
              ))}
              {products.length === 0 && <p>Khong co du lieu phu hop.</p>}
            </div>
          )}
      </section>
    </div>
  )
}

export default App
