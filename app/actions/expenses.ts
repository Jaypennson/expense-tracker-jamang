"use server"

"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

type ExpenseData = {
  amount: number
  description: string
  category_id: string
  date: string
  notes?: string
}

export async function getExpenses() {
try {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: "Unauthorized" }
  }

  // Get user profile for name
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, email")
    .eq("id", user.id)
    .single()

  const userName = profile?.name || profile?.email?.split('@')[0] || "Unknown User"

  const { data, error } = await supabase
    .from("expenses")
    .select(
      `
      *,
      categories (
        id,
        name,
        color
      )
    `
    )
    .eq("user_id", user.id)
    .order("date", { ascending: false })

  if (error) {
    console.error("Error fetching expenses:", error)
    return { error: error.message }
  }

  // Add user name to each expense
  const expensesWithUser = data?.map(expense => ({
    ...expense,
    user_name: userName
  }))

  return { data: expensesWithUser }
  } catch (error) {
    console.error("Unexpected error fetching expenses:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function createExpense(expenseData: ExpenseData) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: "Unauthorized" }
    }

    const { data, error } = await supabase
      .from("expenses")
      .insert({
        ...expenseData,
        user_id: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating expense:", error)
      return { error: error.message }
    }

    revalidatePath("/expenses")
    return { data }
  } catch (error) {
    console.error("Unexpected error creating expense:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function updateExpense(id: string, expenseData: ExpenseData) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: "Unauthorized" }
    }

    // Verify the expense belongs to the user
    const { data: existingExpense, error: fetchError } = await supabase
      .from("expenses")
      .select("user_id")
      .eq("id", id)
      .single()

    if (fetchError || !existingExpense) {
      return { error: "Expense not found" }
    }

    if (existingExpense.user_id !== user.id) {
      return { error: "Unauthorized" }
    }

    const { data, error } = await supabase
      .from("expenses")
      .update(expenseData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating expense:", error)
      return { error: error.message }
    }

    revalidatePath("/expenses")
    return { data }
  } catch (error) {
    console.error("Unexpected error updating expense:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function deleteExpense(id: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: "Unauthorized" }
    }

    // Verify the expense belongs to the user
    const { data: existingExpense, error: fetchError } = await supabase
      .from("expenses")
      .select("user_id")
      .eq("id", id)
      .single()

    if (fetchError || !existingExpense) {
      return { error: "Expense not found" }
    }

    if (existingExpense.user_id !== user.id) {
      return { error: "Unauthorized" }
    }

    const { error } = await supabase.from("expenses").delete().eq("id", id)

    if (error) {
      console.error("Error deleting expense:", error)
      return { error: error.message }
    }

    revalidatePath("/expenses")
    return { success: true }
  } catch (error) {
    console.error("Unexpected error deleting expense:", error)
    return { error: "An unexpected error occurred" }
  }
}
