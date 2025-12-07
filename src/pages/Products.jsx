import { useState, useEffect } from 'react'
import '../styles/Products.css'

// Mock produktų duomenys pagal veterinarijos klinikos specifiką
const PRODUCTS_DATA = [
  // Maistas ir vitaminai
  {
    id: 1,
    name: 'Royal Canin Adult šunų maistas',
    category: 'maistas',
    price: 45.99,
    image: '/api/placeholder/300/200',
    description: 'Subalansuotas maistas suaugusiems šunims su visais reikalingais vitaminais.',
    inStock: true,
    stockCount: 25,
    brand: 'Royal Canin',
    weight: '15kg',
    ageGroup: 'suaugę'
  },
  {
    id: 2,
    name: 'Hill\'s Science Diet kačių maistas',
    category: 'maistas',
    price: 32.50,
    image: '/api/placeholder/300/200',
    description: 'Specialiai sukurtas maistas kačiukams su omega rūgštimis.',
    inStock: true,
    stockCount: 18,
    brand: 'Hill\'s',
    weight: '10kg',
    ageGroup: 'kačiukai'
  },
  {
    id: 3,
    name: 'Vitamin Complex šunims',
    category: 'vitaminai',
    price: 24.99,
    image: '/api/placeholder/300/200',
    description: 'Kompleksas vitaminų šunų imuniteto stiprinimui.',
    inStock: true,
    stockCount: 40,
    brand: 'VetComplex',
    dosage: '60 tablečių'
  },
  
  // Vaistai ir preparatai
  {
    id: 4,
    name: 'Frontline Combo blakių/erkių preparatas',
    category: 'vaistai',
    price: 18.75,
    image: '/api/placeholder/300/200',
    description: 'Efektyvus preparatas nuo blakių ir erkių šunims ir katėms.',
    inStock: true,
    stockCount: 30,
    brand: 'Frontline',
    application: 'lašai ant odos'
  },
  {
    id: 5,
    name: 'Metacam skausmą malšinantis preparatas',
    category: 'vaistai',
    price: 35.20,
    image: '/api/placeholder/300/200',
    description: 'Nesteroidinis vaistas nuo uždegimo ir skausmo šunims.',
    inStock: false,
    stockCount: 0,
    brand: 'Boehringer Ingelheim',
    prescription: true
  },
  {
    id: 6,
    name: 'Antibiotikai amoksicilinas',
    category: 'vaistai',
    price: 28.90,
    image: '/api/placeholder/300/200',
    description: 'Platus spektras antibiotikų infekcinėms ligoms gydyti.',
    inStock: true,
    stockCount: 15,
    brand: 'VetPharm',
    prescription: true
  },
  
  // Priežiūros reikmenys
  {
    id: 7,
    name: 'Šampūnas jautriai odai',
    category: 'prieziura',
    price: 16.45,
    image: '/api/placeholder/300/200',
    description: 'Specialus šampūnas gyvūnams su jautria oda.',
    inStock: true,
    stockCount: 22,
    brand: 'Virbac',
    volume: '250ml'
  },
  {
    id: 8,
    name: 'Dantų valymo rinkinys',
    category: 'prieziura',
    price: 12.30,
    image: '/api/placeholder/300/200',
    description: 'Dantų šepetėlis ir pasta šunų ir kačių dantų higienai.',
    inStock: true,
    stockCount: 35,
    brand: 'DentaVet'
  },
  
  // Reikmenys ir priedai
  {
    id: 9,
    name: 'Veterinariniai pirštai lateksiniai',
    category: 'reikmenys',
    price: 8.99,
    image: '/api/placeholder/300/200',
    description: 'Sterilūs lateksiniai pirštai veterinariniams tyrimams.',
    inStock: true,
    stockCount: 50,
    brand: 'MedVet',
    quantity: '100 vnt.'
  },
  {
    id: 10,
    name: 'Švirštas 5ml',
    category: 'reikmenys',
    price: 2.45,
    image: '/api/placeholder/300/200',
    description: 'Vienkartiniai švirkštai vakcinoms ir vaistams.',
    inStock: true,
    stockCount: 200,
    brand: 'VetSupply',
    sterile: true
  }
]

const CATEGORIES = [
  { id: 'visi', name: 'Visi produktai', icon: '🏥' },
  { id: 'maistas', name: 'Maistas', icon: '🥘' },
  { id: 'vitaminai', name: 'Vitaminai', icon: '💊' },
  { id: 'vaistai', name: 'Vaistai', icon: '💉' },
  { id: 'prieziura', name: 'Priežiūra', icon: '🧴' },
  { id: 'reikmenys', name: 'Reikmenys', icon: '🔬' }
]

const Products = () => {
  const [products, setProducts] = useState(PRODUCTS_DATA)
  const [filteredProducts, setFilteredProducts] = useState(PRODUCTS_DATA)
  const [selectedCategory, setSelectedCategory] = useState('visi')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [showOnlyInStock, setShowOnlyInStock] = useState(false)
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100 })

  // Filtruoti produktus
  useEffect(() => {
    let filtered = [...products]

    // Filtruoti pagal kategoriją
    if (selectedCategory !== 'visi') {
      filtered = filtered.filter(product => product.category === selectedCategory)
    }

    // Filtruoti pagal paiešką
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtruoti pagal likutį sandėlyje
    if (showOnlyInStock) {
      filtered = filtered.filter(product => product.inStock && product.stockCount > 0)
    }

    // Filtruoti pagal kainą
    filtered = filtered.filter(product => 
      product.price >= priceRange.min && product.price <= priceRange.max
    )

    // Rūšiuoti
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'price-asc':
          return a.price - b.price
        case 'price-desc':
          return b.price - a.price
        case 'brand':
          return a.brand.localeCompare(b.brand)
        default:
          return 0
      }
    })

    setFilteredProducts(filtered)
  }, [products, selectedCategory, searchTerm, sortBy, showOnlyInStock, priceRange])

  const handleAddToCart = (product) => {
    // Čia būtų logika prekės pridėjimui į krepšelį
    alert(`Produktas "${product.name}" pridėtas į krepšelį!`)
  }

  const handleRequestQuote = (product) => {
    // Čia būtų logika kainos užklausos siuntimui
    alert(`Kainos užklausa produktui "${product.name}" išsiųsta!`)
  }

  return (
    <div className="products-page">
      <div className="products-header">
        <div className="container">
          <h1>Veterinarijos produktai</h1>
          <p>Aukštos kokybės produktai jūsų augintinių sveikatai ir gerovei</p>
        </div>
      </div>

      <div className="container">
        <div className="products-controls">
          {/* Paieška */}
          <div className="search-section">
            <div className="search-box">
              <input
                type="text"
                placeholder="Ieškoti produktų..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <span className="search-icon">🔍</span>
            </div>
          </div>

          {/* Filtrai */}
          <div className="filters-section">
            <div className="filter-group">
              <label>Rūšiuoti pagal:</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="name">Pavadinimą</option>
                <option value="price-asc">Kainą (mažėjimo tvarka)</option>
                <option value="price-desc">Kainą (didėjimo tvarka)</option>
                <option value="brand">Prekės ženklą</option>
              </select>
            </div>

            <div className="filter-group">
              <label>
                <input
                  type="checkbox"
                  checked={showOnlyInStock}
                  onChange={(e) => setShowOnlyInStock(e.target.checked)}
                />
                Tik sandėlyje esantys
              </label>
            </div>

            <div className="filter-group price-range">
              <label>Kaina: €{priceRange.min} - €{priceRange.max}</label>
              <div className="range-inputs">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({...priceRange, min: parseInt(e.target.value)})}
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({...priceRange, max: parseInt(e.target.value)})}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="products-content">
          {/* Kategorijų meniu */}
          <div className="categories-sidebar">
            <h3>Kategorijos</h3>
            <div className="categories-list">
              {CATEGORIES.map(category => (
                <button
                  key={category.id}
                  className={`category-item ${selectedCategory === category.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <span className="category-icon">{category.icon}</span>
                  <span className="category-name">{category.name}</span>
                  <span className="category-count">
                    ({category.id === 'visi' ? products.length : products.filter(p => p.category === category.id).length})
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Produktų sąrašas */}
          <div className="products-grid">
            {filteredProducts.length === 0 ? (
              <div className="no-products">
                <h3>Produktų nerasta</h3>
                <p>Pabandykite pakeisti paieškos kriterijus arba filtrus.</p>
              </div>
            ) : (
              filteredProducts.map(product => (
                <div key={product.id} className={`product-card ${!product.inStock ? 'out-of-stock' : ''}`}>
                  <div className="product-image">
                    <img src={product.image} alt={product.name} />
                    {!product.inStock && <div className="stock-badge">Nėra sandėlyje</div>}
                    {product.prescription && <div className="prescription-badge">Pagal receptą</div>}
                  </div>

                  <div className="product-info">
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-brand">{product.brand}</p>
                    <p className="product-description">{product.description}</p>

                    <div className="product-details">
                      {product.weight && <span className="detail">📦 {product.weight}</span>}
                      {product.volume && <span className="detail">📦 {product.volume}</span>}
                      {product.quantity && <span className="detail">📦 {product.quantity}</span>}
                      {product.dosage && <span className="detail">💊 {product.dosage}</span>}
                    </div>

                    <div className="product-footer">
                      <div className="price-section">
                        <span className="price">€{product.price.toFixed(2)}</span>
                        {product.inStock && (
                          <span className="stock-info">Sandėlyje: {product.stockCount}</span>
                        )}
                      </div>

                      <div className="product-actions">
                        {product.inStock ? (
                          <button 
                            className="btn primary"
                            onClick={() => handleAddToCart(product)}
                          >
                            Į krepšelį
                          </button>
                        ) : (
                          <button 
                            className="btn secondary"
                            onClick={() => handleRequestQuote(product)}
                          >
                            Užklausti
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Statistika */}
        <div className="products-stats">
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-number">{filteredProducts.length}</span>
              <span className="stat-label">Produktai</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{filteredProducts.filter(p => p.inStock).length}</span>
              <span className="stat-label">Sandėlyje</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{CATEGORIES.length - 1}</span>
              <span className="stat-label">Kategorijos</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{new Set(products.map(p => p.brand)).size}</span>
              <span className="stat-label">Prekės ženklai</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Products