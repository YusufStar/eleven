import { Suspense } from "react"
import { LoginForm } from "@/components/auth/login-form"
import { Spinner } from "@/components/ui/spinner"

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8"><Spinner className="size-8" /></div>}>
      <LoginForm />
    </Suspense>
  )
}
