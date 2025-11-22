import { redirect } from "next/navigation"

export default function Home() {
  // Redirect to cases page as the default landing page
  redirect("/cases")
}

