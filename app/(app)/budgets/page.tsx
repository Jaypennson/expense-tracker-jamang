"use client"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, Edit2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getBudgets, upsertBudget, deleteBudget } from "@/app/actions/budgets"

type BudgetItem = {
  category_id: string
  category_name: string
  category_color: string
  budget_id: string | null
  monthly_limit: number
  spent: number
  remaining: number
  percentage: number
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

export default function BudgetsPage() {
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date()
    return { month: now.getMonth() + 1, year: now.getFullYear() }
  })
  const [budgets, setBudgets] = useState<BudgetItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<BudgetItem | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [monthlyLimit, setMonthlyLimit] = useState("")
  const [formError, setFormError] = useState("")

  useEffect(() => {
    loadBudgets()
  }, [currentDate])

  async function loadBudgets() {
    setIsLoading(true)
    try {
      const result = await getBudgets(currentDate.month, currentDate.year)

      if (result.error) {
        console.error("Error loading budgets:", result.error)
      } else if (result.data) {
        setBudgets(result.data as BudgetItem[])
      }
    } finally {
      setIsLoading(false)
    }
  }

  function goToPreviousMonth() {
    setCurrentDate((prev) => {
      if (prev.month === 1) {
        return { month: 12, year: prev.year - 1 }
      }
      return { month: prev.month - 1, year: prev.year }
    })
  }

  function goToNextMonth() {
    setCurrentDate((prev) => {
      if (prev.month === 12) {
        return { month: 1, year: prev.year + 1 }
      }
      return { month: prev.month + 1, year: prev.year }
    })
  }

  function goToCurrentMonth() {
    const now = new Date()
    setCurrentDate({ month: now.getMonth() + 1, year: now.getFullYear() })
  }

  function openEditDialog(budget: BudgetItem) {
    setEditingBudget(budget)
    setMonthlyLimit(budget.monthly_limit > 0 ? budget.monthly_limit.toString() : "")
    setFormError("")
    setIsDialogOpen(true)
  }

  function openDeleteDialog(budget: BudgetItem) {
    setEditingBudget(budget)
    setIsDeleteDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingBudget) return

    setFormError("")
    setIsSubmitting(true)

    try {
      const limit = parseFloat(monthlyLimit)

      if (!limit || limit <= 0) {
        setFormError("Please enter a valid budget limit")
        setIsSubmitting(false)
        return
      }

      const result = await upsertBudget(
        editingBudget.category_id,
        limit,
        currentDate.month,
        currentDate.year
      )

      if (result.error) {
        setFormError(result.error)
      } else {
        setIsDialogOpen(false)
        await loadBudgets()
      }
    } catch (error) {
      setFormError("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!editingBudget?.budget_id) return

    setIsSubmitting(true)
    try {
      const result = await deleteBudget(editingBudget.budget_id)

      if (result.error) {
        alert(result.error)
      } else {
        setIsDeleteDialogOpen(false)
        setEditingBudget(null)
        await loadBudgets()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  function getProgressColor(percentage: number) {
    if (percentage >= 100) return "bg-destructive"
    if (percentage >= 80) return "bg-yellow-500"
    return "bg-green-500"
  }

  const totalBudget = budgets.reduce((sum, b) => sum + b.monthly_limit, 0)
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0)
  const totalRemaining = totalBudget - totalSpent

  return (
    <div className="space-y-6">
      {/* Header with Month Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Budgets</h1>
          <p className="text-muted-foreground mt-1">
            Track your spending against monthly budgets
          </p>
        </div>
      </div>

      {/* Month Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold">
                {MONTHS[currentDate.month - 1]} {currentDate.year}
              </h2>
              <Button variant="outline" size="sm" onClick={goToCurrentMonth}>
                Today
              </Button>
            </div>
            <Button variant="outline" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ₱{totalBudget.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ₱{totalSpent.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Remaining
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${
                totalRemaining < 0 ? "text-destructive" : "text-green-600"
              }`}
            >
              ₱{totalRemaining.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading budgets...</p>
        </div>
      ) : budgets.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              No categories found. Create categories first to set budgets.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {budgets.map((budget) => (
            <Card key={budget.category_id}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Category Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: budget.category_color }}
                      />
                      <h3 className="font-semibold">{budget.category_name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEditDialog(budget)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      {budget.budget_id && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openDeleteDialog(budget)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Budget Details */}
                  {budget.monthly_limit > 0 ? (
                    <>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            ₱{budget.spent.toLocaleString("en-PH", { minimumFractionDigits: 2 })} of ?
                            {budget.monthly_limit.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                          </span>
                          <span
                            className={`font-medium ${
                              budget.percentage >= 100
                                ? "text-destructive"
                                : budget.percentage >= 80
                                ? "text-yellow-600"
                                : "text-green-600"
                            }`}
                          >
                            {budget.percentage.toFixed(0)}%
                          </span>
                        </div>
                        <div className="relative">
                          <Progress value={Math.min(budget.percentage, 100)} max={100} />
                          <div
                            className={`absolute inset-0 h-2 rounded-full transition-all ${getProgressColor(
                              budget.percentage
                            )}`}
                            style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {budget.remaining >= 0 ? (
                            <>
                              ₱{budget.remaining.toLocaleString("en-PH", { minimumFractionDigits: 2 })}{" "}
                              remaining
                            </>
                          ) : (
                            <>
                              ₱{Math.abs(budget.remaining).toLocaleString("en-PH", { minimumFractionDigits: 2 })}{" "}
                              over budget
                            </>
                          )}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground mb-2">
                        No budget set for this category
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(budget)}
                      >
                        Set Budget
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Budget Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Budget for {editingBudget?.category_name}</DialogTitle>
            <DialogDescription>
              Set the monthly budget limit for {MONTHS[currentDate.month - 1]}{" "}
              {currentDate.year}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="limit">Monthly Limit (?)</Label>
              <Input
                id="limit"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Current spending: ?
                {editingBudget?.spent.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
              </p>
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
                {isSubmitting ? "Saving..." : "Save Budget"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Budget</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the budget for{" "}
              {editingBudget?.category_name}? This will only remove the budget limit,
              not the category itself.
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
