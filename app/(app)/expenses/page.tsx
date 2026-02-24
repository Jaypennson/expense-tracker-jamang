"use client"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { useEffect, useState } from "react"
import { Pencil, Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from "@/app/actions/expenses"
import { getCategories } from "@/app/actions/categories"

type Expense = {
  id: string
  amount: number
  description: string
  category_id: string
  date: string
  user_id: string
  user_name: string
  categories: {
    id: string
    name: string
    color: string
  }
}

type Category = {
  id: string
  name: string
  color: string
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category_id: "",
    date: new Date().toISOString().split("T")[0],
  })
  const [formError, setFormError] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setIsLoading(true)
    try {
      const [expensesResult, categoriesResult] = await Promise.all([
        getExpenses(),
        getCategories(),
      ])

      if (expensesResult.error) {
        console.error("Error loading expenses:", expensesResult.error)
      } else if (expensesResult.data) {
        setExpenses(expensesResult.data as Expense[])
      }

      if (categoriesResult.error) {
        console.error("Error loading categories:", categoriesResult.error)
      } else if (categoriesResult.data) {
        setCategories(categoriesResult.data as Category[])
      }
    } finally {
      setIsLoading(false)
    }
  }

  function openAddDialog() {
    setEditingExpense(null)
    setFormData({
      description: "",
      amount: "",
      category_id: "",
      date: new Date().toISOString().split("T")[0],
    })
    setFormError("")
    setIsDialogOpen(true)
  }

  function openEditDialog(expense: Expense) {
    setEditingExpense(expense)
    setFormData({
      description: expense.description,
      amount: expense.amount.toString(),
      category_id: expense.category_id,
      date: expense.date,
    })
    setFormError("")
    setIsDialogOpen(true)
  }

  function openDeleteDialog(expenseId: string) {
    setDeletingExpenseId(expenseId)
    setIsDeleteDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError("")
    setIsSubmitting(true)

    try {
      const data = {
        description: formData.description,
        amount: parseFloat(formData.amount),
        category_id: formData.category_id,
        date: formData.date,
      }

      if (!data.description || !data.amount || !data.category_id || !data.date) {
        setFormError("All fields are required")
        setIsSubmitting(false)
        return
      }

      let result
      if (editingExpense) {
        result = await updateExpense(editingExpense.id, data)
      } else {
        result = await createExpense(data)
      }

      if (result.error) {
        setFormError(result.error)
      } else {
        setIsDialogOpen(false)
        await loadData()
      }
    } catch (error) {
      setFormError("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deletingExpenseId) return

    setIsSubmitting(true)
    try {
      const result = await deleteExpense(deletingExpenseId)

      if (result.error) {
        alert(result.error)
      } else {
        setIsDeleteDialogOpen(false)
        setDeletingExpenseId(null)
        await loadData()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Expenses</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage your expenses
          </p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="h-4 w-4" />
          Add Expense
        </Button>
      </div>

      <div className="bg-primary text-primary-foreground rounded-lg p-6">
        <p className="text-sm font-medium opacity-90">Total Expenses</p>
        <p className="text-3xl font-bold mt-2">
          ₱{totalExpenses.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading expenses...</p>
        </div>
      ) : expenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border rounded-lg">
          <p className="text-muted-foreground mb-4">No expenses yet</p>
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4" />
            Add Your First Expense
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Added By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {new Date(expense.date).toLocaleDateString("en-PH", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell>
                      <Badge
                        style={{
                          backgroundColor: expense.categories.color,
                          color: "#fff",
                        }}
                      >
                        {expense.categories.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium whitespace-nowrap">
                      ₱{expense.amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {expense.user_name}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEditDialog(expense)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openDeleteDialog(expense.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="border rounded-xl p-4 bg-card shadow-sm"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-base mb-1">
                      {expense.description}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {new Date(expense.date).toLocaleDateString("en-PH", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(expense)}
                      className="h-9 w-9"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDeleteDialog(expense.id)}
                      className="h-9 w-9"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <Badge
                    style={{
                      backgroundColor: expense.categories.color,
                      color: "#fff",
                    }}
                    className="text-xs"
                  >
                    {expense.categories.name}
                  </Badge>
                  <p className="text-lg font-bold">
                    ₱{expense.amount.toLocaleString("en-PH", { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? "Edit Expense" : "Add New Expense"}
            </DialogTitle>
            <DialogDescription>
              {editingExpense
                ? "Update the expense details below."
                : "Fill in the details to add a new expense."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="e.g., Groceries, Gas, Coffee"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₱)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, category_id: value })
                }
              >
                <SelectTrigger id="category" className="w-full">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                required
              />
            </div>

            {formError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {formError}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : editingExpense
                  ? "Update Expense"
                  : "Add Expense"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Expense</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this expense? This action cannot be
              undone.
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