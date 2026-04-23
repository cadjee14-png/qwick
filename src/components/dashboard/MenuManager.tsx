'use client'

import { useState } from 'react'
import { Category, Product } from '@/types'

interface MenuManagerProps {
  initialCategories: Category[]
  initialProducts: Product[]
  shopId: string
}

interface ProductFormData {
  name: string
  description: string
  price: string
  category_id: string
  image_url: string
  is_available: boolean
}

const defaultProductForm: ProductFormData = {
  name: '',
  description: '',
  price: '',
  category_id: '',
  image_url: '',
  is_available: true,
}

type ModalMode = 'create' | 'edit'

export function MenuManager({ initialCategories, initialProducts, shopId }: MenuManagerProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [openAccordions, setOpenAccordions] = useState<Set<string>>(
    new Set(initialCategories.map((c) => c.id))
  )

  // Category state
  const [newCategoryName, setNewCategoryName] = useState('')
  const [addingCategory, setAddingCategory] = useState(false)
  const [savingCategory, setSavingCategory] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  // Product modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<ModalMode>('create')
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [productForm, setProductForm] = useState<ProductFormData>(defaultProductForm)
  const [savingProduct, setSavingProduct] = useState(false)

  // Loading states
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null)
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)
  const [togglingProductId, setTogglingProductId] = useState<string | null>(null)

  // Error
  const [error, setError] = useState<string | null>(null)

  function toggleAccordion(categoryId: string) {
    setOpenAccordions((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) next.delete(categoryId)
      else next.add(categoryId)
      return next
    })
  }

  // ── CATEGORIES ───────────────────────────────────────────────────────────

  async function handleAddCategory() {
    if (!newCategoryName.trim()) return
    setSavingCategory(true)
    setError(null)

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName.trim(), shop_id: shopId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erreur')
      setCategories((prev) => [...prev, json.category])
      setOpenAccordions((prev) => new Set([...prev, json.category.id]))
      setNewCategoryName('')
      setAddingCategory(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création de la catégorie')
    } finally {
      setSavingCategory(false)
    }
  }

  async function handleRenameCategory(categoryId: string) {
    if (!renameValue.trim()) return

    try {
      const res = await fetch(`/api/categories/${categoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: renameValue.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erreur')
      setCategories((prev) => prev.map((c) => (c.id === categoryId ? json.category : c)))
      setRenamingId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du renommage')
    }
  }

  async function handleDeleteCategory(categoryId: string) {
    if (!confirm('Supprimer cette catégorie et tous ses produits ?')) return
    setDeletingCategoryId(categoryId)
    setError(null)

    try {
      const res = await fetch(`/api/categories/${categoryId}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erreur')
      setCategories((prev) => prev.filter((c) => c.id !== categoryId))
      setProducts((prev) => prev.filter((p) => p.category_id !== categoryId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression')
    } finally {
      setDeletingCategoryId(null)
    }
  }

  // ── PRODUCTS ─────────────────────────────────────────────────────────────

  function openCreateModal(categoryId: string) {
    setProductForm({ ...defaultProductForm, category_id: categoryId })
    setEditingProductId(null)
    setModalMode('create')
    setModalOpen(true)
  }

  function openEditModal(product: Product) {
    setProductForm({
      name: product.name,
      description: product.description ?? '',
      price: String(product.price),
      category_id: product.category_id,
      image_url: product.image_url ?? '',
      is_available: product.is_available,
    })
    setEditingProductId(product.id)
    setModalMode('edit')
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingProductId(null)
    setProductForm(defaultProductForm)
  }

  async function handleSaveProduct() {
    if (!productForm.name.trim()) {
      setError('Le nom du produit est requis')
      return
    }
    const price = parseFloat(productForm.price)
    if (isNaN(price) || price < 0) {
      setError('Le prix doit être un nombre valide')
      return
    }

    setSavingProduct(true)
    setError(null)

    try {
      if (modalMode === 'create') {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: productForm.name.trim(),
            description: productForm.description.trim() || null,
            price,
            category_id: productForm.category_id,
            shop_id: shopId,
            image_url: productForm.image_url.trim() || null,
            is_available: productForm.is_available,
          }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? 'Erreur')
        setProducts((prev) => [...prev, json.product])
      } else if (editingProductId) {
        const res = await fetch(`/api/products/${editingProductId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: productForm.name.trim(),
            description: productForm.description.trim() || null,
            price,
            category_id: productForm.category_id,
            image_url: productForm.image_url.trim() || null,
            is_available: productForm.is_available,
          }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? 'Erreur')
        setProducts((prev) => prev.map((p) => (p.id === editingProductId ? json.product : p)))
      }
      closeModal()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    } finally {
      setSavingProduct(false)
    }
  }

  async function handleToggleAvailability(product: Product) {
    setTogglingProductId(product.id)

    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_available: !product.is_available }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erreur')
      setProducts((prev) => prev.map((p) => (p.id === product.id ? json.product : p)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du changement de disponibilité')
    } finally {
      setTogglingProductId(null)
    }
  }

  async function handleDeleteProduct(productId: string) {
    if (!confirm('Supprimer ce produit ?')) return
    setDeletingProductId(productId)
    setError(null)

    try {
      const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erreur')
      setProducts((prev) => prev.filter((p) => p.id !== productId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression')
    } finally {
      setDeletingProductId(null)
    }
  }

  // ── RENDER ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Menu</h1>
          <p className="text-[#71717A] text-sm mt-0.5">Gérez vos catégories et produits</p>
        </div>
        <button
          onClick={() => setAddingCategory(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white text-sm font-semibold rounded-xl transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
          </svg>
          Nouvelle catégorie
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl px-4 py-3 text-[#EF4444] text-sm flex items-center justify-between gap-3">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-[#EF4444] hover:text-white transition shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>
      )}

      {/* Add category inline form */}
      {addingCategory && (
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-4 flex items-center gap-3">
          <input
            autoFocus
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddCategory()
              if (e.key === 'Escape') setAddingCategory(false)
            }}
            placeholder="Nom de la catégorie"
            className="flex-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-sm text-white placeholder-[#71717A] focus:outline-none focus:border-[#FF6B35]/50 focus:ring-1 focus:ring-[#FF6B35]/20 transition"
          />
          <button
            onClick={handleAddCategory}
            disabled={savingCategory || !newCategoryName.trim()}
            className="px-4 py-2 bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition"
          >
            {savingCategory ? 'Création…' : 'Créer'}
          </button>
          <button
            onClick={() => { setAddingCategory(false); setNewCategoryName('') }}
            className="px-3 py-2 text-[#71717A] hover:text-white text-sm transition"
          >
            Annuler
          </button>
        </div>
      )}

      {/* Empty state */}
      {categories.length === 0 && !addingCategory && (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-[#2A2A2A] rounded-2xl gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-[#71717A]">
              <path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Zm0 5.25a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-white text-sm font-medium">Aucune catégorie</p>
            <p className="text-[#71717A] text-sm mt-0.5">Commencez par ajouter une catégorie</p>
          </div>
        </div>
      )}

      {/* Categories list */}
      <div className="flex flex-col gap-3">
        {categories.map((category) => {
          const categoryProducts = products.filter((p) => p.category_id === category.id)
          const isOpen = openAccordions.has(category.id)

          return (
            <div key={category.id} className="bg-[#111111] border border-[#2A2A2A] rounded-2xl overflow-hidden">
              {/* Category header */}
              <div className="flex items-center gap-3 px-4 py-3.5">
                <button
                  onClick={() => toggleAccordion(category.id)}
                  className="flex-1 flex items-center gap-2.5 text-left min-w-0"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={`w-4 h-4 text-[#71717A] shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                  >
                    <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                  </svg>

                  {renamingId === category.id ? (
                    <input
                      autoFocus
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameCategory(category.id)
                        if (e.key === 'Escape') setRenamingId(null)
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 bg-[#1A1A1A] border border-[#FF6B35]/40 rounded-lg px-2.5 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#FF6B35]/20"
                    />
                  ) : (
                    <span className="font-semibold text-white text-sm truncate">{category.name}</span>
                  )}

                  <span className="text-xs text-[#71717A] shrink-0 bg-[#1A1A1A] border border-[#2A2A2A] rounded-full px-2 py-0.5">
                    {categoryProducts.length}
                  </span>
                </button>

                {/* Category actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {renamingId === category.id ? (
                    <>
                      <button
                        onClick={() => handleRenameCategory(category.id)}
                        className="px-3 py-1.5 text-xs bg-[#FF6B35] text-white rounded-lg font-semibold hover:bg-[#FF6B35]/90 transition"
                      >
                        OK
                      </button>
                      <button
                        onClick={() => setRenamingId(null)}
                        className="px-2 py-1.5 text-xs text-[#71717A] hover:text-white transition"
                      >
                        Annuler
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => openCreateModal(category.id)}
                        title="Ajouter un produit"
                        className="p-1.5 text-[#71717A] hover:text-[#FF6B35] hover:bg-[#FF6B35]/10 rounded-lg transition"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => { setRenamingId(category.id); setRenameValue(category.name) }}
                        title="Renommer"
                        className="p-1.5 text-[#71717A] hover:text-white hover:bg-[#1A1A1A] rounded-lg transition"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        disabled={deletingCategoryId === category.id}
                        title="Supprimer"
                        className="p-1.5 text-[#71717A] hover:text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg transition disabled:opacity-50"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Products list */}
              {isOpen && (
                <div className="border-t border-[#2A2A2A]">
                  {categoryProducts.length === 0 ? (
                    <div className="px-5 py-6 flex flex-col items-center gap-2">
                      <p className="text-[#71717A] text-sm">Aucun produit dans cette catégorie</p>
                      <button
                        onClick={() => openCreateModal(category.id)}
                        className="text-sm text-[#FF6B35] hover:text-[#FF6B35]/80 font-medium transition"
                      >
                        + Ajouter un produit
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-[#2A2A2A]">
                      {categoryProducts.map((product) => (
                        <div
                          key={product.id}
                          className="group flex items-center gap-3 px-4 py-3 hover:bg-[#1A1A1A]/50 transition"
                        >
                          {/* Availability toggle (pill switch) */}
                          <button
                            onClick={() => handleToggleAvailability(product)}
                            disabled={togglingProductId === product.id}
                            title={product.is_available ? 'Disponible — cliquer pour désactiver' : 'Indisponible — cliquer pour activer'}
                            className={`relative shrink-0 w-9 h-5 rounded-full transition-colors ${
                              product.is_available ? 'bg-[#22C55E]' : 'bg-[#2A2A2A]'
                            } disabled:opacity-50`}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                                product.is_available ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>

                          {/* Product info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-medium truncate ${product.is_available ? 'text-white' : 'text-[#71717A]'}`}>
                                {product.name}
                              </span>
                              {!product.is_available && (
                                <span className="text-xs px-2 py-0.5 bg-[#1A1A1A] border border-[#2A2A2A] text-[#71717A] rounded-full shrink-0 font-medium">
                                  Indisponible
                                </span>
                              )}
                            </div>
                            {product.description && (
                              <p className="text-xs text-[#71717A] truncate mt-0.5">{product.description}</p>
                            )}
                          </div>

                          {/* Price */}
                          <span className="text-sm font-semibold text-white tabular-nums shrink-0">
                            {product.price.toFixed(2)} €
                          </span>

                          {/* Product actions — visible on hover */}
                          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEditModal(product)}
                              title="Modifier"
                              className="p-1.5 text-[#71717A] hover:text-white hover:bg-[#2A2A2A] rounded-lg transition"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              disabled={deletingProductId === product.id}
                              title="Supprimer"
                              className="p-1.5 text-[#71717A] hover:text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg transition disabled:opacity-50"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Product modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl w-full max-w-md shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A2A]">
              <h2 className="text-base font-bold text-white">
                {modalMode === 'create' ? 'Nouveau produit' : 'Modifier le produit'}
              </h2>
              <button
                onClick={closeModal}
                className="p-1.5 text-[#71717A] hover:text-white hover:bg-[#1A1A1A] rounded-lg transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 flex flex-col gap-4">
              {error && (
                <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl px-3.5 py-2.5 text-[#EF4444] text-sm">
                  {error}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-[#71717A] uppercase tracking-wider mb-1.5">
                  Nom du produit *
                </label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Ex : Burger Classic"
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-[#71717A] focus:outline-none focus:border-[#FF6B35]/50 focus:ring-1 focus:ring-[#FF6B35]/20 transition"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-[#71717A] uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Description courte du produit"
                  rows={2}
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-[#71717A] focus:outline-none focus:border-[#FF6B35]/50 focus:ring-1 focus:ring-[#FF6B35]/20 transition resize-none"
                />
              </div>

              {/* Price + Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#71717A] uppercase tracking-wider mb-1.5">
                    Prix (€) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={productForm.price}
                    onChange={(e) => setProductForm((p) => ({ ...p, price: e.target.value }))}
                    placeholder="0.00"
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-[#71717A] focus:outline-none focus:border-[#FF6B35]/50 focus:ring-1 focus:ring-[#FF6B35]/20 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#71717A] uppercase tracking-wider mb-1.5">
                    Catégorie
                  </label>
                  <select
                    value={productForm.category_id}
                    onChange={(e) => setProductForm((p) => ({ ...p, category_id: e.target.value }))}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF6B35]/50 focus:ring-1 focus:ring-[#FF6B35]/20 transition"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-xs font-semibold text-[#71717A] uppercase tracking-wider mb-1.5">
                  URL image (optionnel)
                </label>
                <input
                  type="url"
                  value={productForm.image_url}
                  onChange={(e) => setProductForm((p) => ({ ...p, image_url: e.target.value }))}
                  placeholder="https://…"
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-[#71717A] focus:outline-none focus:border-[#FF6B35]/50 focus:ring-1 focus:ring-[#FF6B35]/20 transition"
                />
              </div>

              {/* Availability toggle */}
              <div className="flex items-center justify-between py-1">
                <div>
                  <span className="text-sm font-medium text-white">Disponible à la vente</span>
                  <p className="text-xs text-[#71717A] mt-0.5">
                    {productForm.is_available ? 'Visible dans le menu client' : 'Masqué du menu client'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setProductForm((p) => ({ ...p, is_available: !p.is_available }))}
                  className={`relative w-10 h-6 rounded-full transition-colors ${
                    productForm.is_available ? 'bg-[#22C55E]' : 'bg-[#2A2A2A]'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                      productForm.is_available ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#2A2A2A]">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm text-[#71717A] hover:text-white transition"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveProduct}
                disabled={savingProduct}
                className="px-5 py-2 bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition"
              >
                {savingProduct ? 'Sauvegarde…' : modalMode === 'create' ? 'Créer le produit' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
