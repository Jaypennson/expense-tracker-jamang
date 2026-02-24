import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is logged in, redirect to dashboard
  // If not logged in, redirect to login page
  if (user) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
