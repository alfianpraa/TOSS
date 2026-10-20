import Link from "next/link";
import { Ticket } from "lucide-react";
import { LoginForm } from "./LoginForm";
import { LoginHero } from "@/components/login/LoginHero";
import { AnimatedBackground } from "@/components/login/AnimatedBackground";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = params.callbackUrl ?? "/board";

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center p-4 sm:p-8">
      <AnimatedBackground />
      <div className="flex w-full max-w-4xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl">
        <div className="flex w-full flex-col justify-center px-6 py-6 sm:px-10 lg:w-1/2 lg:px-10">
          <div className="mx-auto w-full max-w-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-dark text-white">
              <Ticket className="h-4 w-4" />
            </div>

            <h1 className="mt-4 text-2xl font-bold text-zinc-900">Log In</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="font-semibold text-brand underline underline-offset-2 hover:opacity-80">
                Sign up
              </Link>
            </p>

            <div className="mt-5">
              <LoginForm callbackUrl={callbackUrl} />
            </div>

            <div className="mt-5 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-500">
              <p className="font-medium text-zinc-700">Demo accounts</p>
              <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1">
                <p>sales@demo.com</p>
                <p>developer@demo.com</p>
                <p>marketing@demo.com</p>
                <p>admin@demo.com</p>
              </div>
              <p className="mt-1.5 text-zinc-400">Password for all: Password123!</p>
            </div>
          </div>
        </div>

        <LoginHero />
      </div>
    </div>
  );
}
