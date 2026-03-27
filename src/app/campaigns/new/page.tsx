'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function NewCampaignPage() {
  const router = useRouter()

  useEffect(() => {
    supabase
      .from('campaigns')
      .insert({ name: 'Untitled Campaign', status: 'active' })
      .select()
      .single()
      .then(({ data }) => {
        if (data) router.replace(`/campaigns/${data.id}/wizard`)
      })
  }, [router])

  return <p className="text-gray-400 text-sm">Creating campaign...</p>
}
