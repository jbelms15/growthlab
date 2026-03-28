'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/strategy', label: 'Strategy' },
  { href: '/playbook', label: 'Playbook' },
]

export default function Nav() {
  const pathname = usePathname()

  return (
    <nav className="border-b border-gray-200 bg-white sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 flex items-center gap-6 h-13">
        <span className="font-semibold text-gray-900 text-sm tracking-tight">GrowthLab</span>
        <div className="flex gap-1">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm px-3 py-1.5 rounded-md ${
                pathname === link.href
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
