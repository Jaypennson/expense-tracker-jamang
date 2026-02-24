"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function getBudgets(month: number, year: number) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: "Unauthorized" }
    }

    // Get all categories for the user
    const { data: categories, error: categoriesError } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true })

    if (categoriesError) {
      console.error("Error fetching categories:", categoriesError)
      return { error: categoriesError.message }
    }

    // Get budgets for the specified month/year
    const { data: budgets, error: budgetsError } = await supabase
      .from("budgets")
      .select("*")
      .eq("user_id", user.id)
      .eq("month", month)
      .eq("year", year)

    if (budgetsError) {
      console.error("Error fetching budgets:", budgetsError)
      return { error: budgetsError.message }
    }

    // Get expenses for the month to calculate spending
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`
    const endDate = new Date(year, month, 0).toISOString().split("T")[0]

    const { data: expenses, error: expensesError } = await supabase
      .from("expenses")
      .select("category_id, amount")
      .eq("user_id", user.id)
      .gte("date", startDate)
      .lte("date", endDate)

    if (expensesError) {
      console.error("Error fetching expenses:", expensesError)
      return { error: expensesError.message }
    }

    // Calculate spending per category
    const spendingByCategory = expenses?.reduce((acc, expense) => {
      acc[expense.category_id] = (acc[expense.category_id] || 0) + expense.amount
      return acc
    }, {} as Record<string, number>) || {}

    // Combine categories with budgets and spending
    const budgetData = categories?.map((category) => {
      const budget = budgets?.find((b) => b.category_id === category.id)
      const spent = spendingByCategory[category.id] || 0

      return {
        category_id: category.id,
        category_name: category.name,
        category_color: category.color,
        budget_id: budget?.id || null,
        monthly_limit: budget?.monthly_limit || 0,
        spent,
        remaining: (budget?.monthly_limit || 0) - spent,
        percentage: budget?.monthly_limit ? (spent / budget.monthly_limit) * 100 : 0,
      }
    })

    return { data: budgetData }
  } catch (error) {
    console.error("Unexpected error fetching budgets:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function upsertBudget(
  category_id: string,
  monthly_limit: number,
  month: number,
  year: number
) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: "Unauthorized" }
    }

    // Check if budget already exists
    const { data: existingBudget } = await supabase
      .from("budgets")
      .select("id")
      .eq("user_id", user.id)
      .eq("category_id", category_id)
      .eq("month", month)
      .eq("year", year)
      .single()

    let result
    if (existingBudget) {
      // Update existing budget
      result = await supabase
        .from("budgets")
        .update({ monthly_limit })
        .eq("id", existingBudget.id)
        .select()
        .single()
    } else {
      // Insert new budget
      result = await supabase
        .from("budgets")
        .insert({
          user_id: user.id,
          category_id,
          monthly_limit,
          month,
          year,
        })
        .select()
        .single()
    }

    if (result.error) {
      console.error("Error upserting budget:", result.error)
      return { error: result.error.message }
    }

    revalidatePath("/budgets")
    return { data: result.data }
  } catch (error) {
    console.error("Unexpected error upserting budget:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function deleteBudget(id: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: "Unauthorized" }
    }

    // Verify the budget belongs to the user
    const { data: existingBudget, error: fetchError } = await supabase
      .from("budgets")
      .select("user_id")
      .eq("id", id)
      .single()

    if (fetchError || !existingBudget) {
      return { error: "Budget not found" }
    }

    if (existingBudget.user_id !== user.id) {
      return { error: "Unauthorized" }
    }

    const { error } = await supabase.from("budgets").delete().eq("id", id)

    if (error) {
      console.error("Error deleting budget:", error)
      return { error: error.message }
    }

    revalidatePath("/budgets")
    return { success: true }
  } catch (error) {
    console.error("Unexpected error deleting budget:", error)
    return { error: "An unexpected error occurred" }
  }
}
