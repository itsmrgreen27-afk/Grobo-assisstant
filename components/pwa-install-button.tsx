'use client'

import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { playClick } from '@/lib/audio'

type PwaInstallButtonProps = {
  accent: string
}

export function PwaInstallButton({ accent }: PwaInstallButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    playClick()
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
    }
  }

  if (!deferredPrompt) return null

  return (
    <button
      type="button"
      onClick={handleInstall}
      aria-label="Install App"
      title="Install App"
      className="fixed top-4 right-4 z-30 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-white shadow-xl backdrop-blur-xl transition-all hover:bg-white/10"
    >
      <Download className="h-4 w-4" style={{ color: accent }} />
      <span className="hidden sm:inline">Install App</span>
    </button>
  )
}