"use client"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/app/actions/categories"

type Category = {
  id: string
  name: string
  color: string
  user_id: string
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    color: "#3b82f6",
  })
  const [formError, setFormError] = useState("")

  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    setIsLoading(true)
    try {
      const result = await getCategories()

      if (result.error) {
        console.error("Error loading categories:", result.error)
      } else if (result.data) {
        setCategories(result.data as Category[])
      }
    } finally {
      setIsLoading(false)
    }
  }

  function openAddDialog() {
    setEditingCategory(null)
    setFormData({
      name: "",
      color: "#3b82f6",
    })
    setFormError("")
    setIsDialogOpen(true)
  }

  function openEditDialog(category: Category) {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      color: category.color,
    })
    setFormError("")
    setIsDialogOpen(true)
  }

  function openDeleteDialog(categoryId: string) {
    setDeletingCategoryId(categoryId)
    setIsDeleteDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError("")
    setIsSubmitting(true)

    try {
      if (!formData.name || !formData.color) {
        setFormError("All fields are required")
        setIsSubmitting(false)
        return
      }

      let result
      if (editingCategory) {
        result = await updateCategory(editingCategory.id, formData.name, formData.color)
      } else {
        result = await createCategory(formData.name, formData.color)
      }

      if (result.error) {
        setFormError(result.error)
      } else {
        setIsDialogOpen(false)
        await loadCategories()
      }
    } catch (error) {
      setFormError("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deletingCategoryId) return

    setIsSubmitting(true)
    try {
      const result = await deleteCategory(deletingCategoryId)

      if (result.error) {
        alert(result.error)
      } else {
        setIsDeleteDialogOpen(false)
        setDeletingCategoryId(null)
        await loadCategories()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground mt-1">
            Manage your expense categories
          </p>
        </div>
        <Button onClick={openAddDialog} className="gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Categories Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Loading categories...</p>
        </div>
      ) : categories.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <p className="text-muted-foreground mb-4">No categories yet</p>
              <Button onClick={openAddDialog} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Category
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <Card key={category.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full border-2 border-border"
                      style={{ backgroundColor: category.color }}
                    />
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => openEditDialog(category)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => openDeleteDialog(category.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Color: <span className="font-mono">{category.color}</span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Add New Category"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Update the category details below."
                : "Create a new category for organizing expenses."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Category Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Food, Transport, Entertainment"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="color">Color *</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    className="w-20 h-10 cursor-pointer"
                    required
                  />
                  <Input
                    type="text"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    placeholder="#3b82f6"
                    className="flex-1 font-mono"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Choose a color to identify this category
                </p>
              </div>

              {formError && (
                <p className="text-sm text-destructive">{formError}</p>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
                className="flex-1 sm:flex-initial"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1 sm:flex-initial">
                {isSubmitting
                  ? "Saving..."
                  : editingCategory
                  ? "Update Category"
                  : "Add Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this category? This action cannot be
              undone. Expenses in this category may be affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
