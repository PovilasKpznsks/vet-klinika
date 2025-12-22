import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import Chatbot from "../components/Chatbot";
import "../styles/Products.css";

// Categories mapped from ProductType enum
const CATEGORIES = [
  { id: "visi", name: "Visi produktai", icon: "🏥", type: null },
  { id: "Food", name: "Maistas", icon: "🥘", type: 0 },
  { id: "Supplements", name: "Papildai", icon: "💊", type: 1 },
  { id: "Hygiene", name: "Higiena", icon: "🧴", type: 2 },
  { id: "Medicine", name: "Vaistai", icon: "💉", type: 3 },
];

// Role types matching backend enum
const ROLE_TYPES = {
  Administrator: 0,
  Veterinarian: 1,
  Client: 2,
};

// Product Form Modal Component (outside main component to prevent recreation)
const ProductFormModal = ({
  isEdit,
  onSubmit,
  onClose,
  formData,
  handleFormChange,
  imagePreview,
  handleImageChange,
  handleRemoveImage,
  saving,
  uploading,
}) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h2>{isEdit ? "Redaguoti produktą" : "Pridėti naują produktą"}</h2>
        <button className="modal-close-btn" onClick={onClose}>
          ×
        </button>
      </div>

      <form onSubmit={onSubmit} className="product-form">
        <div className="form-group">
          <label htmlFor="name">Pavadinimas *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleFormChange}
            required
            placeholder="Įveskite produkto pavadinimą"
          />
        </div>

        <div className="form-group">
          <label htmlFor="type">Kategorija *</label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleFormChange}
            required
          >
            {CATEGORIES.filter((c) => c.type !== null).map((cat) => (
              <option key={cat.id} value={cat.type}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="manufacturer">Gamintojas</label>
          <input
            type="text"
            id="manufacturer"
            name="manufacturer"
            value={formData.manufacturer}
            onChange={handleFormChange}
            placeholder="Įveskite gamintojo pavadinimą"
          />
        </div>

        <div className="form-group">
          <label>Nuotrauka</label>
          <div className="image-upload-container">
            {imagePreview ? (
              <div className="image-preview-wrapper">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="image-preview"
                />
                <button
                  type="button"
                  className="btn-remove-image"
                  onClick={handleRemoveImage}
                >
                  ✕ Pašalinti
                </button>
              </div>
            ) : (
              <label className="image-upload-label">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleImageChange}
                  className="image-upload-input"
                />
                <div className="image-upload-placeholder">
                  <span className="upload-icon">📷</span>
                  <span>Pasirinkite nuotrauką</span>
                  <span className="upload-hint">
                    JPG, PNG, GIF, WEBP (max 5MB)
                  </span>
                </div>
              </label>
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description">Aprašymas</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleFormChange}
            rows="4"
            placeholder="Įveskite produkto aprašymą"
          />
        </div>

        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={onClose}>
            Atšaukti
          </button>
          <button
            type="submit"
            className="btn-submit"
            disabled={saving || uploading}
          >
            {uploading
              ? "Įkeliama nuotrauka..."
              : saving
              ? "Saugoma..."
              : isEdit
              ? "Atnaujinti"
              : "Pridėti"}
          </button>
        </div>
      </form>
    </div>
  </div>
);

const Products = () => {
  const { user, isAuthenticated } = useAuth();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("visi");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productIdFromUrl, setProductIdFromUrl] = useState(null);

  // Admin state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    type: 0,
    description: "",
    photoUrl: "",
    manufacturer: "",
  });
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Check if user is admin
  const isAdmin = isAuthenticated && user?.role === ROLE_TYPES.Administrator;

  // Get auth token
  const getAuthToken = () => {
    return localStorage.getItem("auth_token");
  };

  // Check URL for product ID on mount and handle browser back/forward
  useEffect(() => {
    const checkUrlForProduct = () => {
      const params = new URLSearchParams(window.location.search);
      const productId = params.get("product");
      setProductIdFromUrl(productId);
    };

    checkUrlForProduct();

    // Listen for browser back/forward navigation
    window.addEventListener("popstate", checkUrlForProduct);
    return () => window.removeEventListener("popstate", checkUrlForProduct);
  }, []);

  // When products are loaded and there's a product ID in URL, select that product
  useEffect(() => {
    if (productIdFromUrl && products.length > 0) {
      const product = products.find((p) => p.id === productIdFromUrl);
      if (product) {
        setSelectedProduct(product);
      }
    }
  }, [productIdFromUrl, products]);

  // Handle selecting a product - update URL
  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    const newUrl = `${window.location.pathname}?product=${product.id}`;
    window.history.pushState({ productId: product.id }, "", newUrl);
  };

  // Handle going back to product list - update URL
  const handleBackToList = () => {
    setSelectedProduct(null);
    window.history.pushState({}, "", window.location.pathname);
  };

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5068/api/Product");
      if (!response.ok) {
        throw new Error("Nepavyko gauti produktų");
      }
      const data = await response.json();
      setProducts(data);
      setFilteredProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Get ProductType name from enum value
  const getTypeName = (typeValue) => {
    const category = CATEGORIES.find((c) => c.type === typeValue);
    return category ? category.name : "Kita";
  };

  // Filter products
  useEffect(() => {
    let filtered = [...products];

    // Filter by category
    if (selectedCategory !== "visi") {
      const category = CATEGORIES.find((c) => c.id === selectedCategory);
      if (category) {
        filtered = filtered.filter((product) => product.type === category.type);
      }
    }

    // Filter by search
    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          product.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  }, [products, selectedCategory, searchTerm]);

  // Admin functions
  const handleAddProduct = () => {
    setFormData({
      name: "",
      type: 0,
      description: "",
      photoUrl: "",
      manufacturer: "",
    });
    setImageFile(null);
    setImagePreview(null);
    setShowAddModal(true);
  };

  const handleEditProduct = (product, e) => {
    e.stopPropagation();
    setEditingProduct(product);
    setFormData({
      name: product.name || "",
      type: product.type || 0,
      description: product.description || "",
      photoUrl: product.photoUrl || "",
      manufacturer: product.manufacturer || "",
    });
    setImageFile(null);
    setImagePreview(product.photoUrl ? getImageUrl(product.photoUrl) : null);
    setShowEditModal(true);
  };

  const handleDeleteProduct = async (product, e) => {
    e.stopPropagation();
    if (
      !window.confirm(`Ar tikrai norite ištrinti produktą "${product.name}"?`)
    ) {
      return;
    }

    try {
      const token = getAuthToken();
      const response = await fetch(
        `http://localhost:5068/api/Product/${product.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Nepavyko ištrinti produkto");
      }

      await fetchProducts();
      alert("Produktas sėkmingai ištrintas!");
    } catch (err) {
      alert("Klaida: " + err.message);
    }
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = getAuthToken();
      let photoUrl = formData.photoUrl;

      // Upload image if file selected
      if (imageFile) {
        setUploading(true);
        const uploadFormData = new FormData();
        uploadFormData.append("file", imageFile);

        const uploadResponse = await fetch(
          "http://localhost:5068/api/Product/upload-image",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: uploadFormData,
          }
        );

        if (!uploadResponse.ok) {
          throw new Error("Nepavyko įkelti nuotraukos");
        }

        const uploadResult = await uploadResponse.json();
        photoUrl = uploadResult.photoUrl;
        setUploading(false);
      }

      const response = await fetch("http://localhost:5068/api/Product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...formData, photoUrl }),
      });

      if (!response.ok) {
        throw new Error("Nepavyko pridėti produkto");
      }

      setShowAddModal(false);
      setImageFile(null);
      setImagePreview(null);
      await fetchProducts();
      alert("Produktas sėkmingai pridėtas!");
    } catch (err) {
      alert("Klaida: " + err.message);
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = getAuthToken();
      let photoUrl = formData.photoUrl;

      // Upload new image if file selected
      if (imageFile) {
        setUploading(true);
        const uploadFormData = new FormData();
        uploadFormData.append("file", imageFile);

        const uploadResponse = await fetch(
          "http://localhost:5068/api/Product/upload-image",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: uploadFormData,
          }
        );

        if (!uploadResponse.ok) {
          throw new Error("Nepavyko įkelti nuotraukos");
        }

        const uploadResult = await uploadResponse.json();
        photoUrl = uploadResult.photoUrl;
        setUploading(false);
      }

      const response = await fetch(
        `http://localhost:5068/api/Product/${editingProduct.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ...formData, photoUrl }),
        }
      );

      if (!response.ok) {
        throw new Error("Nepavyko atnaujinti produkto");
      }

      setShowEditModal(false);
      setEditingProduct(null);
      setImageFile(null);
      setImagePreview(null);
      await fetchProducts();

      if (selectedProduct?.id === editingProduct.id) {
        setSelectedProduct({ ...editingProduct, ...formData, photoUrl });
      }

      alert("Produktas sėkmingai atnaujintas!");
    } catch (err) {
      alert("Klaida: " + err.message);
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "type" ? parseInt(value) : value,
    }));
  }, []);

  // Handle image file selection
  const handleImageChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        alert("Netinkamas failo tipas. Leidžiami: JPG, PNG, GIF, WEBP");
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Failas per didelis. Maksimalus dydis: 5MB");
        return;
      }
      setImageFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  // Remove selected image
  const handleRemoveImage = useCallback(() => {
    setImageFile(null);
    setImagePreview(null);
    setFormData((prev) => ({ ...prev, photoUrl: "" }));
  }, []);

  // Helper to get full image URL
  const getImageUrl = (photoUrl) => {
    if (!photoUrl) return null;
    // If it's already a full URL, return as is
    if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) {
      return photoUrl;
    }
    // Otherwise, prepend the backend URL
    return `http://localhost:5068${photoUrl}`;
  };

  if (loading) {
    return (
      <div className="products-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Kraunami produktai...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="products-page">
        <div className="error-container">
          <h3>Klaida</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            Bandyti dar kartą
          </button>
        </div>
      </div>
    );
  }

  // Product Detail View
  if (selectedProduct) {
    return (
      <div className="products-page">
        <div className="products-header">
          <div className="container">
            <h1>Produkto informacija</h1>
            <p>Išsami informacija apie pasirinktą produktą</p>
          </div>
        </div>

        <div className="container">
          <div className="detail-actions-row">
            <button className="back-button" onClick={handleBackToList}>
              ← Grįžti į produktų sąrašą
            </button>

            {isAdmin && (
              <div className="admin-detail-actions">
                <button
                  className="btn-edit"
                  onClick={(e) => handleEditProduct(selectedProduct, e)}
                >
                  ✏️ Redaguoti
                </button>
                <button
                  className="btn-delete"
                  onClick={(e) => {
                    handleDeleteProduct(selectedProduct, e);
                    handleBackToList();
                  }}
                >
                  🗑️ Ištrinti
                </button>
              </div>
            )}
          </div>

          <div className="product-detail-window">
            <div className="product-detail-image">
              {selectedProduct.photoUrl &&
              selectedProduct.photoUrl.length > 0 ? (
                <img
                  src={getImageUrl(selectedProduct.photoUrl)}
                  alt={selectedProduct.name}
                  onError={(e) => {
                    console.error(
                      "Image load error:",
                      getImageUrl(selectedProduct.photoUrl)
                    );
                    e.target.style.display = "none";
                  }}
                />
              ) : (
                <div className="no-image-large">📦</div>
              )}
            </div>

            <div className="product-detail-info">
              <span className="detail-type-badge">
                {CATEGORIES.find((c) => c.type === selectedProduct.type)?.icon}{" "}
                {getTypeName(selectedProduct.type)}
              </span>

              <h1 className="detail-title">{selectedProduct.name}</h1>

              {selectedProduct.manufacturer && (
                <div className="detail-row">
                  <span className="detail-label">Gamintojas:</span>
                  <span className="detail-value">
                    {selectedProduct.manufacturer}
                  </span>
                </div>
              )}

              <div className="detail-row">
                <span className="detail-label">Kategorija:</span>
                <span className="detail-value">
                  {getTypeName(selectedProduct.type)}
                </span>
              </div>

              {selectedProduct.description && (
                <div className="detail-description">
                  <h3>Aprašymas</h3>
                  <p>{selectedProduct.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        {showEditModal && (
          <ProductFormModal
            isEdit={true}
            onSubmit={handleSubmitEdit}
            onClose={() => {
              setShowEditModal(false);
              setEditingProduct(null);
            }}
            formData={formData}
            handleFormChange={handleFormChange}
            imagePreview={imagePreview}
            handleImageChange={handleImageChange}
            handleRemoveImage={handleRemoveImage}
            saving={saving}
            uploading={uploading}
          />
        )}
      </div>
    );
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
          {/* Search */}
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

          {/* Filters and Admin Button */}
          <div className="filters-section">
            {isAdmin && (
              <button className="btn-add-product" onClick={handleAddProduct}>
                ➕ Pridėti produktą
              </button>
            )}
          </div>
        </div>

        <div className="products-content">
          {/* Categories sidebar */}
          <div className="categories-sidebar">
            <h3>Kategorijos</h3>
            <div className="categories-list">
              {CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  className={`category-item ${
                    selectedCategory === category.id ? "active" : ""
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <span className="category-icon">{category.icon}</span>
                  <span className="category-name">{category.name}</span>
                  <span className="category-count">
                    (
                    {category.id === "visi"
                      ? products.length
                      : products.filter((p) => p.type === category.type).length}
                    )
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Products list */}
          <div className="products-grid">
            {filteredProducts.length === 0 ? (
              <div className="no-products">
                <h3>Produktų nerasta</h3>
                <p>Pabandykite pakeisti paieškos kriterijus arba filtrus.</p>
              </div>
            ) : (
              filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="product-card clickable"
                  onClick={() => handleSelectProduct(product)}
                >
                  <div className="product-image">
                    {product.photoUrl && product.photoUrl.length > 0 ? (
                      <img
                        src={getImageUrl(product.photoUrl)}
                        alt={product.name}
                      />
                    ) : (
                      <div className="no-image">📦</div>
                    )}
                    <div className="type-badge">
                      {getTypeName(product.type)}
                    </div>
                  </div>

                  <div className="product-info">
                    <h3 className="product-name">{product.name}</h3>
                    {product.manufacturer && (
                      <p className="product-brand">{product.manufacturer}</p>
                    )}
                    {product.description && (
                      <p className="product-description">
                        {product.description}
                      </p>
                    )}

                    <div className="product-footer">
                      <span className="product-type-tag">
                        {CATEGORIES.find((c) => c.type === product.type)?.icon}{" "}
                        {getTypeName(product.type)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <ProductFormModal
          isEdit={false}
          onSubmit={handleSubmitAdd}
          onClose={() => setShowAddModal(false)}
          formData={formData}
          handleFormChange={handleFormChange}
          imagePreview={imagePreview}
          handleImageChange={handleImageChange}
          handleRemoveImage={handleRemoveImage}
          saving={saving}
          uploading={uploading}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <ProductFormModal
          isEdit={true}
          onSubmit={handleSubmitEdit}
          onClose={() => {
            setShowEditModal(false);
            setEditingProduct(null);
          }}
          formData={formData}
          handleFormChange={handleFormChange}
          imagePreview={imagePreview}
          handleImageChange={handleImageChange}
          handleRemoveImage={handleRemoveImage}
          saving={saving}
          uploading={uploading}
        />
      )}

      <Chatbot />
    </div>
  );
};

export default Products;
