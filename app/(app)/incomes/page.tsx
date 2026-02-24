"use client"

"use client"

import { useEffect, useState } from "react"
import { Pencil, Trash2, Plus, TrendingUp, TrendingDown } from "lucide-react"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  getIncomes,
  createIncome,
  updateIncome,
  deleteIncome,
} from "@/app/actions/incomes"
import { getCategories } from "@/app/actions/categories"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

type Income = {
  id: string
  amount: number
  description: string
  source: string
  date: string
  notes?: string
  user_id: string
  user_name: string
  type?: 'income' | 'expense'
}

type Category = {
  id: string
  name: string
  color: string
  user_id: string
}

export default function IncomesPage() {
const [incomes, setIncomes] = useState<Income[]>([])
const [categories, setCategories] = useState<Category[]>([])
const [isLoading, setIsLoading] = useState(true)
const [isDialogOpen, setIsDialogOpen] = useState(false)
const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
const [editingIncome, setEditingIncome] = useState<Income | null>(null)
const [deletingIncomeId, setDeletingIncomeId] = useState<string | null>(null)
const [isSubmitting, setIsSubmitting] = useState(false)
  
// Pagination states
const [currentPage, setCurrentPage] = useState(1)
const itemsPerPage = 5
  
// Filter state
const [dateFilter, setDateFilter] = useState<'daily' | 'monthly' | 'yearly'>('monthly')

const [formData, setFormData] = useState({
  description: "",
  amount: "",
  source: "",
  date: new Date().toISOString().split("T")[0],
  notes: "",
  type: "income" as "income" | "expense",
})
const [formError, setFormError] = useState("")

  useEffect(() => {
    loadIncomes()
    loadCategories()
  }, [])

  async function loadIncomes() {
    setIsLoading(true)
    try {
      const result = await getIncomes()
      if (result.error) {
        console.error("Error loading incomes:", result.error)
      } else if (result.data) {
        setIncomes(result.data as Income[])
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function loadCategories() {
    try {
      const result = await getCategories()
      if (result.error) {
        console.error("Error loading categories:", result.error)
      } else if (result.data) {
        setCategories(result.data as Category[])
      }
    } catch (error) {
      console.error("Error loading categories:", error)
    }
  }

  function openDialog(income?: Income) {
    if (income) {
      setEditingIncome(income)
      setFormData({
        description: income.description,
        amount: income.amount.toString(),
        source: income.source,
        date: income.date,
        notes: income.notes || "",
        type: income.type || "income",
      })
    } else {
      setEditingIncome(null)
      setFormData({
        description: "",
        amount: "",
        source: "",
        date: new Date().toISOString().split("T")[0],
        notes: "",
        type: "income",
      })
    }
    setFormError("")
    setIsDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError("")

    // Validation
    if (!formData.description.trim()) {
      setFormError("Description is required")
      return
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setFormError("Amount must be greater than 0")
      return
    }
    if (!formData.source.trim()) {
      setFormError("Source is required")
      return
    }
    if (!formData.date) {
      setFormError("Date is required")
      return
    }

    setIsSubmitting(true)
    try {
      const incomeData = {
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        source: formData.source.trim(),
        date: formData.date,
        notes: formData.notes.trim() || undefined,
        type: formData.type,
      }

      const result = editingIncome
        ? await updateIncome(editingIncome.id, incomeData)
        : await createIncome(incomeData)

      if (result.error) {
        setFormError(result.error)
      } else {
        setIsDialogOpen(false)
        await loadIncomes()
      }
    } catch (error) {
      setFormError("An error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deletingIncomeId) return

    setIsSubmitting(true)
    try {
      const result = await deleteIncome(deletingIncomeId)
      if (result.error) {
        console.error("Error deleting income:", result.error)
      } else {
        setIsDeleteDialogOpen(false)
        setDeletingIncomeId(null)
        await loadIncomes()
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filter transactions by date range
  const getFilteredIncomes = () => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()
    const currentDay = now.getDate()

    return incomes.filter((income) => {
      const incomeDate = new Date(income.date)
      const incomeYear = incomeDate.getFullYear()
      const incomeMonth = incomeDate.getMonth()
      const incomeDay = incomeDate.getDate()

      switch (dateFilter) {
        case 'daily':
          return (
            incomeYear === currentYear &&
            incomeMonth === currentMonth &&
            incomeDay === currentDay
          )
        case 'monthly':
          return incomeYear === currentYear && incomeMonth === currentMonth
        case 'yearly':
          return incomeYear === currentYear
        default:
          return true
      }
    })
  }

  const filteredIncomes = getFilteredIncomes()
  
  // Calculate totals from filtered data
  const totalIncome = filteredIncomes.reduce((sum, income) => {
    if (income.type === 'expense') return sum - income.amount
    return sum + income.amount
  }, 0)
  
  const totalIncomeOnly = filteredIncomes
    .filter(i => i.type !== 'expense')
    .reduce((sum, income) => sum + income.amount, 0)
  
  const totalExpenseOnly = filteredIncomes
    .filter(i => i.type === 'expense')
    .reduce((sum, income) => sum + income.amount, 0)
  
  // Pagination logic
  const totalPages = Math.ceil(filteredIncomes.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedIncomes = filteredIncomes.slice(startIndex, endIndex)

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [dateFilter])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading incomes...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Transactions</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage your income and expenses
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button onClick={() => openDialog()} className="gap-2 flex-1 sm:flex-initial">
            <Plus className="h-4 w-4" />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Date Filter Tabs */}
      <Card>
        <CardContent className="px-6">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={dateFilter === 'daily' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateFilter('daily')}
              className={`flex-1 min-w-[100px] ${
                dateFilter === 'daily' 
                  ? 'bg-primary text-primary-foreground shadow-md' 
                  : 'hover:bg-accent'
              }`}
            >
              Today
            </Button>
            <Button
              variant={dateFilter === 'monthly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateFilter('monthly')}
              className={`flex-1 min-w-[100px] ${
                dateFilter === 'monthly' 
                  ? 'bg-primary text-primary-foreground shadow-md' 
                  : 'hover:bg-accent'
              }`}
            >
              This Month
            </Button>
            <Button
              variant={dateFilter === 'yearly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateFilter('yearly')}
              className={`flex-1 min-w-[100px] ${
                dateFilter === 'yearly' 
                  ? 'bg-primary text-primary-foreground shadow-md' 
                  : 'hover:bg-accent'
              }`}
            >
              This Year
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Income</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                                  ₱{totalIncomeOnly.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600 mt-2">
                                  ₱{totalExpenseOnly.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Net Balance</p>
              <p className={`text-2xl font-bold mt-2 ${totalIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ₱{totalIncome.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Incomes Table/Cards */}
      <Card>
        <CardContent className="p-0">
          {incomes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <p className="text-muted-foreground mb-4">No transaction records yet</p>
              <Button onClick={() => openDialog()} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Transaction
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredIncomes.map((income) => (
                      <TableRow key={income.id}>
                        <TableCell>
                          <Badge variant={income.type === 'expense' ? 'destructive' : 'default'} className="gap-1">
                            {income.type === 'expense' ? (
                              <><TrendingDown className="h-3 w-3" /> Expense</>
                            ) : (
                              <><TrendingUp className="h-3 w-3" /> Income</>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {new Date(income.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="font-medium">{income.description}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{income.source}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {income.notes || "-"}
                        </TableCell>
                        <TableCell className={`text-right font-semibold ${income.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
                          {income.type === 'expense' ? '-' : ''}₱{income.amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDialog(income)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setDeletingIncomeId(income.id)
                                setIsDeleteDialogOpen(true)
                              }}
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
              <div className="md:hidden space-y-3 p-4">
                {paginatedIncomes.map((income) => (
                  <Card key={income.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <Badge variant={income.type === 'expense' ? 'destructive' : 'default'} className="gap-1">
                          {income.type === 'expense' ? (
                            <><TrendingDown className="h-3 w-3" /> Expense</>
                          ) : (
                            <><TrendingUp className="h-3 w-3" /> Income</>
                          )}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {new Date(income.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <p className="font-semibold text-base">{income.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">{income.source}</Badge>
                          </div>
                        </div>
                        
                        {income.notes && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {income.notes}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between pt-2 border-t">
                          <p className={`text-xl font-bold ${income.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
                            {income.type === 'expense' ? '-' : ''}₱{income.amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDialog(income)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setDeletingIncomeId(income.id)
                                setIsDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {/* Mobile Pagination */}
                {filteredIncomes.length > itemsPerPage && (
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Showing {startIndex + 1}-{Math.min(endIndex, filteredIncomes.length)} of {filteredIncomes.length}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant={currentPage === page ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingIncome ? "Edit Transaction" : "Add Transaction"}
            </DialogTitle>
            <DialogDescription>
              {editingIncome
                ? "Update the transaction details below."
                : "Enter the details of your transaction."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Type *</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: "income" })}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                      formData.type === "income"
                        ? "border-green-600 bg-green-50 text-green-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <TrendingUp className="h-4 w-4" />
                    <span className="font-medium text-sm">Income</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: "expense" })}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                      formData.type === "expense"
                        ? "border-red-600 bg-red-50 text-red-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <TrendingDown className="h-4 w-4" />
                    <span className="font-medium text-sm">Expense</span>
                  </button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  placeholder="e.g., Monthly Salary"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount (₱) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="source">{formData.type === 'expense' ? 'Category' : 'Source'} *</Label>
                <Select
                  value={formData.source}
                  onValueChange={(value) =>
                    setFormData({ ...formData, source: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={formData.type === 'expense' ? 'Select a category' : 'Select a source'} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.length === 0 ? (
                      <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                        No categories yet. Create one in the Categories page.
                      </div>
                    ) : (
                      categories.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes..."
                  rows={3}
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
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
                  : editingIncome
                  ? "Update Transaction"
                  : "Add Transaction"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Transaction</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this transaction record? This action cannot be
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
