import { Suspense } from "react"
import { SignupForm } from "@/components/auth/signup-form"
import { Spinner } from "@/components/ui/spinner"

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8"><Spinner className="size-8" /></div>}>
      <SignupForm />
    </Suspense>
  )
}
