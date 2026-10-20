import Link from "next/link";
import { Ticket } from "lucide-react";
import { SignupForm } from "./SignupForm";
import { LoginHero } from "@/components/login/LoginHero";
import { AnimatedBackground } from "@/components/login/AnimatedBackground";

export default function SignupPage() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center p-4 sm:p-8">
      <AnimatedBackground />
      <div className="flex w-full max-w-4xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl">
        <div className="flex w-full flex-col justify-center px-6 py-6 sm:px-10 lg:w-1/2 lg:px-10">
          <div className="mx-auto w-full max-w-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-dark text-white">
              <Ticket className="h-4 w-4" />
            </div>

            <h1 className="mt-4 text-2xl font-bold text-zinc-900">Sign Up</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-brand underline underline-offset-2 hover:opacity-80">
                Log In
              </Link>
            </p>

            <div className="mt-5">
              <SignupForm />
            </div>

            <p className="mt-4 text-xs text-zinc-400">
              Admin accounts can&apos;t be created through this form. Contact
              your system admin if you need Admin access.
            </p>
          </div>
        </div>

        <LoginHero />
      </div>
    </div>
  );
}
