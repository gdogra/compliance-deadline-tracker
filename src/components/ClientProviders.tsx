'use client'

import dynamic from 'next/dynamic'

const CommandPalette = dynamic(() => import('@/components/CommandPalette'), { ssr: false })
const Chatbot = dynamic(() => import('@/components/Chatbot'), { ssr: false })

export default function ClientProviders() {
  return (
    <>
      <CommandPalette />
      <Chatbot />
    </>
  )
}
