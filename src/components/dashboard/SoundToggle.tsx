'use client'

import { useState } from 'react'

interface SoundToggleProps {
  onAudioUnlocked?: () => void
  onToggle?: (enabled: boolean) => void
}

export function SoundToggle({ onAudioUnlocked, onToggle }: SoundToggleProps) {
  const [enabled, setEnabled] = useState(false)

  function handleToggle() {
    const next = !enabled
    setEnabled(next)
    if (next && onAudioUnlocked) {
      onAudioUnlocked()
    }
    if (onToggle) {
      onToggle(next)
    }
  }

  return (
    <button
      onClick={handleToggle}
      title={enabled ? 'Son activé — cliquer pour désactiver' : 'Son désactivé — cliquer pour activer'}
      className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
        enabled
          ? 'bg-[#FF6B35]/10 text-[#FF6B35] border border-[#FF6B35]/20 hover:bg-[#FF6B35]/20'
          : 'bg-[#1A1A1A] text-[#71717A] border border-[#2A2A2A] hover:text-white hover:bg-[#2A2A2A]'
      }`}
    >
      {enabled ? (
        /* Bell active */
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path d="M10 3.75a.75.75 0 0 0-1.264-.546L4.703 7H3.167a.75.75 0 0 0-.7.48A6.985 6.985 0 0 0 2 10c0 .887.165 1.737.467 2.52.111.29.39.48.7.48h1.536l4.033 3.796A.75.75 0 0 0 10 16.25V3.75ZM15.95 5.05a.75.75 0 0 0-1.06 1.061 5.5 5.5 0 0 1 0 7.778.75.75 0 0 0 1.06 1.06 7 7 0 0 0 0-9.899Z" />
          <path d="M13.829 7.172a.75.75 0 0 0-1.061 1.06 2.5 2.5 0 0 1 0 3.536.75.75 0 0 0 1.06 1.06 4 4 0 0 0 0-5.656Z" />
        </svg>
      ) : (
        /* Bell muted (crossed) */
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path d="M9.547 3.062A.75.75 0 0 1 10 3.75v12.5a.75.75 0 0 1-1.264.546L4.703 13H3.167a.75.75 0 0 1-.7-.48A6.985 6.985 0 0 1 2 10c0-.887.165-1.737.467-2.52a.75.75 0 0 1 .7-.48h1.536l4.033-3.796a.75.75 0 0 1 .811-.142ZM13.28 7.22a.75.75 0 1 0-1.06 1.06L13.94 10l-1.72 1.72a.75.75 0 0 0 1.06 1.06L15 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L16.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L15 8.94l-1.72-1.72Z" />
        </svg>
      )}
      <span className="hidden sm:inline">
        {enabled ? 'Son activé' : 'Son désactivé'}
      </span>
    </button>
  )
}

export function playNotificationSound(audioCtxRef: React.MutableRefObject<AudioContext | null>) {
  try {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext()
    }
    const ctx = audioCtxRef.current
    if (ctx.state === 'suspended') {
      ctx.resume()
    }

    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(880, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.15)

    gainNode.gain.setValueAtTime(0.4, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.5)
  } catch (e) {
    console.warn('[SoundToggle] Audio error:', e)
  }
}
