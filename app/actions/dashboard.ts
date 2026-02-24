"use server"

import { createClient } from "@/lib/supabase/server"

export async function getDashboardData() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: "Unauthorized" }
    }

    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    // Get all expenses for the current year (from incomes table with type='expense')
    const startOfYear = `${currentYear}-01-01`
    const endOfYear = `${currentYear}-12-31`

    const { data: yearExpensesRaw, error: yearError } = await supabase
      .from("incomes")
      .select("*")
      .eq("user_id", user.id)
      .eq("type", "expense")
      .gte("date", startOfYear)
      .lte("date", endOfYear)

    if (yearError) {
      console.error("Error fetching expenses:", yearError)
      return { error: yearError.message }
    }

    // Map expenses to include a default category
    const yearExpenses = yearExpensesRaw?.map(expense => ({
      ...expense,
      categories: {
        name: expense.source || "Uncategorized",
        color: "#888888"
      }
    })) || []

    // Get all incomes for the current year (from incomes table with type='income' or null)
    const { data: yearIncomes, error: incomeError } = await supabase
      .from("incomes")
      .select("*")
      .eq("user_id", user.id)
      .or("type.eq.income,type.is.null")
      .gte("date", startOfYear)
      .lte("date", endOfYear)

    if (incomeError) {
      console.error("Error fetching incomes:", incomeError)
      return { error: incomeError.message }
    }

    // Calculate current month expenses
    const startOfMonth = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`
    const endOfMonth = new Date(currentYear, currentMonth, 0)
      .toISOString()
      .split("T")[0]

    const monthExpenses = yearExpenses?.filter(
      (e) => e.date >= startOfMonth && e.date <= endOfMonth
    ) || []

    const monthIncomes = yearIncomes?.filter(
      (i) => i.date >= startOfMonth && i.date <= endOfMonth
    ) || []

    const totalExpensesThisMonth = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0)
    const totalIncomesThisMonth = monthIncomes.reduce((sum, i) => sum + Number(i.amount), 0)
    const totalExpensesThisYear = yearExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0
    const totalIncomesThisYear = yearIncomes?.reduce((sum, i) => sum + Number(i.amount), 0) || 0
    const balanceThisMonth = totalIncomesThisMonth - totalExpensesThisMonth
    const balanceThisYear = totalIncomesThisYear - totalExpensesThisYear
    const expenseCount = monthExpenses.length

    // Calculate biggest category this month (using source as category)
    const categoryTotals = monthExpenses.reduce((acc, expense) => {
      const categoryName = expense.source || "Uncategorized"
      acc[categoryName] = (acc[categoryName] || 0) + Number(expense.amount)
      return acc
    }, {} as Record<string, number>)

    const biggestCategory = Object.entries(categoryTotals).sort(
      ([, a], [, b]) => (b as number) - (a as number)
    )[0]

    // Daily spending for current month
    const dailySpending = monthExpenses.reduce((acc, expense) => {
      const day = new Date(expense.date).getDate()
      acc[day] = (acc[day] || 0) + Number(expense.amount)
      return acc
    }, {} as Record<number, number>)

    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()
    const dailyData = Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      amount: dailySpending[i + 1] || 0,
    }))

    // Category breakdown for pie chart (using source as category)
    const categoryBreakdown = Object.entries(categoryTotals).map(
      ([name, amount]) => {
        return {
          name,
          value: amount as number,
          color: "#888888",
        }
      }
    )

    // Last 6 months spending
    const monthlyData = []
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(currentYear, currentMonth - 1 - i, 1)
      const month = targetDate.getMonth() + 1
      const year = targetDate.getFullYear()
      const monthName = targetDate.toLocaleDateString("en-US", { month: "short" })

      const startDate = `${year}-${String(month).padStart(2, "0")}-01`
      const endDate = new Date(year, month, 0).toISOString().split("T")[0]

      const monthTotal =
        yearExpenses?.filter((e) => e.date >= startDate && e.date <= endDate)
          .reduce((sum, e) => sum + Number(e.amount), 0) || 0

      monthlyData.push({
        month: monthName,
        amount: monthTotal as number,
      })
    }

    return {
      data: {
        summary: {
          totalExpensesThisMonth,
          totalIncomesThisMonth,
          balanceThisMonth,
          totalExpensesThisYear,
          totalIncomesThisYear,
          balanceThisYear,
          biggestCategory: biggestCategory
            ? { name: biggestCategory[0], amount: biggestCategory[1] }
            : null,
          expenseCount,
        },
        dailySpending: dailyData,
        categoryBreakdown,
        monthlySpending: monthlyData,
      },
    }
  } catch (error) {
    console.error("Unexpected error fetching dashboard data:", error)
    return { error: "An unexpected error occurred" }
  }
}
