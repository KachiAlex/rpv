"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpenText, Monitor, Upload } from 'lucide-react';
import clsx from 'clsx';

export function Navbar() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href;
  return (
    <header className="border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container-max flex items-center justify-between py-4">
        <Link href="/" className="font-semibold tracking-tight">RPV Bible</Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link className={clsx('hover:text-brand-700', isActive('/') && 'text-brand-700 font-medium')} href="/">Home</Link>
          <Link className={clsx('hover:text-brand-700 inline-flex items-center gap-2', isActive('/read') && 'text-brand-700 font-medium')} href="/read"><BookOpenText size={16}/>Read</Link>
          <Link className={clsx('hover:text-brand-700 inline-flex items-center gap-2', isActive('/projector') && 'text-brand-700 font-medium')} href="/projector"><Monitor size={16}/>Projector</Link>
          <Link className={clsx('hover:text-brand-700 inline-flex items-center gap-2', isActive('/admin') && 'text-brand-700 font-medium')} href="/admin"><Upload size={16}/>Admin</Link>
        </nav>
      </div>
    </header>
  );
}


