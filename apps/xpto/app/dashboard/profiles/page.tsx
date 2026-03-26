import { redirect } from "next/navigation";

// /dashboard/profiles just redirects to the main dashboard for now
// This route will become a dedicated profiles management page later
export default function ProfilesPage() {
  redirect("/dashboard");
}
