"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

type IncomeData = {
  amount: number
  description: string
  source: string
  date: string
  notes?: string
  type?: 'income' | 'expense'
}

export async function getIncomes() {
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
      .from("incomes")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false })

    if (error) {
      return { error: error.message }
    }

    // Add user_name to each income record
    const incomesWithUser = data?.map((income) => ({
      ...income,
      user_name: userName,
    }))

    return { data: incomesWithUser }
  } catch (error) {
    return { error: "Failed to fetch incomes" }
  }
}

export async function createIncome(incomeData: IncomeData) {
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
      .from("incomes")
      .insert([
        {
          user_id: user.id,
          amount: incomeData.amount,
          description: incomeData.description,
          source: incomeData.source,
          date: incomeData.date,
          notes: incomeData.notes || null,
          type: incomeData.type || 'income',
        },
      ])
      .select()

    if (error) {
      return { error: error.message }
    }

    revalidatePath("/incomes")
    revalidatePath("/dashboard")
    return { data }
  } catch (error) {
    return { error: "Failed to create income" }
  }
}

export async function updateIncome(id: string, incomeData: IncomeData) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: "Unauthorized" }
    }

    const { data, error} = await supabase
      .from("incomes")
      .update({
        amount: incomeData.amount,
        description: incomeData.description,
        source: incomeData.source,
        date: incomeData.date,
        notes: incomeData.notes || null,
        type: incomeData.type || 'income',
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()

    if (error) {
      return { error: error.message }
    }

    revalidatePath("/incomes")
    revalidatePath("/dashboard")
    return { data }
  } catch (error) {
    return { error: "Failed to update income" }
  }
}

export async function deleteIncome(id: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: "Unauthorized" }
    }

    const { error } = await supabase
      .from("incomes")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) {
      return { error: error.message }
    }

    revalidatePath("/incomes")
    revalidatePath("/dashboard")
    return { data: { success: true } }
  } catch (error) {
    return { error: "Failed to delete income" }
  }
}
