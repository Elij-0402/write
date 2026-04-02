'use client'
import * as React from 'react'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

interface SheetProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
  side?: 'left' | 'right'
}

export function Sheet({ open, onClose, children, className, side = 'right' }: SheetProps) {
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div className={cn(
        'fixed top-0 z-50 h-full bg-background shadow-xl flex flex-col',
        side === 'right' && 'right-0 w-[420px] border-l',
        side === 'left' && 'left-0 w-[280px] border-r',
        className
      )}>
        {children}
      </div>
    </>
  )
}
