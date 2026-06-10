import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export default async function Home() {
  const authed = await isAuthenticated();

  if (authed) {
    redirect("/inbox");
  }

  return <LoginForm />;
}
