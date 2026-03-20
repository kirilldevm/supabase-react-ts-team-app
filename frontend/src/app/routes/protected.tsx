import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { createClient } from '@/lib/client'
import { Button } from '@/components/ui/button'
import type { User } from '@supabase/supabase-js'

export default function ProtectedPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data, error }) => {
      setLoading(false)
      if (error || !data?.user) {
        navigate('/login', { replace: true })
        return
      }
      setUser(data.user)
    })
  }, [navigate])

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex items-center justify-center h-screen gap-2">
      <p>
        Hello <span className="text-primary font-semibold">{user.email}</span>
      </p>
      <Link to="/logout">
        <Button>Logout</Button>
      </Link>
    </div>
  )
}
