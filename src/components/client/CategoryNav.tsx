'use client'

import { useEffect, useRef, useState } from 'react'
import { Category } from '@/types'

interface CategoryNavProps {
  categories: Category[]
}

export function CategoryNav({ categories }: CategoryNavProps) {
  const [activeId, setActiveId] = useState<string>(categories[0]?.id ?? '')
  const scrollRef = useRef<HTMLDivElement>(null)

  // Scroll-spy: observe each category section
  useEffect(() => {
    if (categories.length === 0) return

    const observers: IntersectionObserver[] = []

    categories.forEach((cat) => {
      const el = document.getElementById(`category-${cat.id}`)
      if (!el) return

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveId(cat.id)
            }
          })
        },
        { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
      )
      observer.observe(el)
      observers.push(observer)
    })

    return () => observers.forEach((o) => o.disconnect())
  }, [categories])

  // Scroll active pill into view in the nav bar
  useEffect(() => {
    if (!scrollRef.current) return
    const activePill = scrollRef.current.querySelector<HTMLButtonElement>(
      `[data-id="${activeId}"]`
    )
    activePill?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [activeId])

  function handleClick(id: string) {
    setActiveId(id)
    const el = document.getElementById(`category-${id}`)
    if (el) {
      // Offset for the sticky nav (approx 64px)
      const top = el.getBoundingClientRect().top + window.scrollY - 64
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide"
    >
      {categories.map((cat) => (
        <button
          key={cat.id}
          data-id={cat.id}
          onClick={() => handleClick(cat.id)}
          className={[
            'shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap',
            activeId === cat.id
              ? 'text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06)]'
              : 'bg-[#1E1E1E] text-[#A0A0A0] hover:text-white hover:bg-[#2A2A2A]',
          ].join(' ')}
          style={
            activeId === cat.id
              ? { backgroundColor: 'var(--brand, #FF6B35)' }
              : undefined
          }
        >
          {cat.name}
        </button>
      ))}
    </div>
  )
}
