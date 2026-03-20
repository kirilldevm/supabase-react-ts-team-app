import { type EmailOtpType } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { createClient } from '@/lib/client'

export default function AuthConfirm() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type') as EmailOtpType | null
    const nextParam = searchParams.get('next')
    const next = nextParam?.startsWith('/') ? nextParam : '/protected'

    if (!token_hash || !type) {
      setError('No token hash or type')
      return
    }

    const supabase = createClient()
    supabase.auth
      .verifyOtp({ type, token_hash })
      .then(({ error: verifyError }) => {
        if (verifyError) {
          navigate(`/auth/error?error=${encodeURIComponent(verifyError.message)}`, {
            replace: true,
          })
          return
        }
        navigate(next, { replace: true })
      })
  }, [searchParams, navigate])

  if (error) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh items-center justify-center">
      <p className="text-muted-foreground">Confirming...</p>
    </div>
  )
}
