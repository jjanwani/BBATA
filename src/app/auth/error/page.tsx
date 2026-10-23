import Link from 'next/link'
import { Logo } from '@/components/Logo'

export default async function AuthErrorPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const { message } = await searchParams
  const domainProblem = message?.toLowerCase().includes('umich') || message?.toLowerCase().includes('database error')

  return (
    <main className="grid min-h-screen place-items-center bg-gray-50 px-4">
      <div className="card w-full max-w-md p-8 text-center">
        <Logo className="text-xl" />
        <h1 className="mt-6 text-xl font-bold text-navy">We couldn&apos;t sign you in</h1>
        <p className="mt-2 text-sm text-gray-600">
          {domainProblem
            ? 'Ross Reddit is only open to University of Michigan students. Please sign in with your @umich.edu Google account.'
            : 'Something went wrong while signing in. Please try again.'}
        </p>
        {message && <p className="mt-4 rounded-lg bg-gray-100 p-3 text-left font-mono text-xs break-words text-gray-500">{message}</p>}
        <Link href="/login" className="btn-primary mt-6 w-full">
          Back to sign in
        </Link>
      </div>
    </main>
  )
}
