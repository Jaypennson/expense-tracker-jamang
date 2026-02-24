"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function getCategories() {
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
      .from("categories")
      .select("*")
      .order("name", { ascending: true })

    if (error) {
      console.error("Error fetching categories:", error)
      return { error: error.message }
    }

    return { data }
  } catch (error) {
    console.error("Unexpected error fetching categories:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function createCategory(name: string, color: string) {
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
      .from("categories")
      .insert({
        name,
        color,
        user_id: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating category:", error)
      return { error: error.message }
    }

    revalidatePath("/categories")
    return { data }
  } catch (error) {
    console.error("Unexpected error creating category:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function updateCategory(id: string, name: string, color: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: "Unauthorized" }
    }

    // Verify the category belongs to the user
    const { data: existingCategory, error: fetchError } = await supabase
      .from("categories")
      .select("user_id")
      .eq("id", id)
      .single()

    if (fetchError || !existingCategory) {
      return { error: "Category not found" }
    }

    if (existingCategory.user_id !== user.id) {
      return { error: "Unauthorized" }
    }

    const { data, error } = await supabase
      .from("categories")
      .update({ name, color })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating category:", error)
      return { error: error.message }
    }

    revalidatePath("/categories")
    return { data }
  } catch (error) {
    console.error("Unexpected error updating category:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function deleteCategory(id: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: "Unauthorized" }
    }

    // Verify the category belongs to the user
    const { data: existingCategory, error: fetchError } = await supabase
      .from("categories")
      .select("user_id")
      .eq("id", id)
      .single()

    if (fetchError || !existingCategory) {
      return { error: "Category not found" }
    }

    if (existingCategory.user_id !== user.id) {
      return { error: "Unauthorized" }
    }

    const { error } = await supabase.from("categories").delete().eq("id", id)

    if (error) {
      console.error("Error deleting category:", error)
      return { error: error.message }
    }

    revalidatePath("/categories")
    return { success: true }
  } catch (error) {
    console.error("Unexpected error deleting category:", error)
    return { error: "An unexpected error occurred" }
  }
}
