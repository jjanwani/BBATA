import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="grid min-h-[60vh] place-items-center px-4 text-center">
      <div>
        <p className="text-5xl font-black text-maize">404</p>
        <h1 className="mt-2 text-xl font-bold text-navy">We couldn&apos;t find that page</h1>
        <p className="mt-1 text-sm text-gray-500">It may have been deleted, or you might not have access to it.</p>
        <Link href="/" className="btn-primary mt-6">Go home</Link>
      </div>
    </main>
  )
}
