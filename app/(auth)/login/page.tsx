'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react'
import { getPublicStats } from '@/lib/actions/public-stats'
import { formatCurrency } from '@/lib/utils/currency'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [pending, setPending] = useState(false)
  const [stats, setStats] = useState({ memberCount: 0, totalAssets: 0 })

  useEffect(() => {
    getPublicStats().then(setStats)
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      if (!data.session?.user) throw new Error('No active session after login')

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role_id')
        .eq('id', data.session.user.id)
        .single()

      if (profileError) throw profileError

      let roleName = 'member'
      if (profile?.role_id) {
        const { data: roleData } = await supabase.from('roles').select('name').eq('id', profile.role_id).single()
        roleName = roleData?.name || 'member'
      }

      if (roleName === 'admin' || roleName === 'committee') {
        router.push('/admin/dashboard')
        return
      }
      router.push('/portal/dashboard')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-bg-base overflow-hidden">
      {/* Left Side - Hero / Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-accent items-center justify-center p-12 text-white relative">
        <div className="absolute inset-0 bg-gradient-to-br from-accent via-accent-hover to-black opacity-90" />
        <div className="relative z-10 max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/20">
              <ShieldCheck className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">LACOWE</h2>
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight leading-tight mb-6">
            Empowering Your <span className="text-success">Financial</span> Prosperity
          </h1>
          <p className="text-xl text-white/70 leading-relaxed mb-8">
            The complete management information system for LACOWE Welfare Group. 
            Securely manage savings, shares, and loans with ease.
          </p>
          <div className="flex items-center gap-8 border-t border-white/10 pt-8 mt-auto">
            <div>
              <div className="text-3xl font-black text-white leading-none">
                {stats.memberCount > 1000 ? `${(stats.memberCount / 1000).toFixed(1)}k+` : stats.memberCount}
              </div>
              <div className="text-xs font-bold text-white/50 uppercase tracking-widest mt-2">Active Members</div>
            </div>
            <div className="h-10 w-[1px] bg-white/10" />
            <div>
              <div className="text-3xl font-black text-white leading-none uppercase">
                {stats.totalAssets >= 1000000 ? `KES ${(stats.totalAssets / 1000000).toFixed(1)}M+` : formatCurrency(stats.totalAssets)}
              </div>
              <div className="text-xs font-bold text-white/50 uppercase tracking-widest mt-2">Total Assets</div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 left-12 text-sm text-white/40">
          © 2026 LACOWE Welfare Group. Together We Prosper.
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 bg-bg-surface">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
             <ShieldCheck className="h-8 w-8 text-accent" />
             <span className="text-2xl font-bold text-accent">LACOWE</span>
          </div>
          
          <div className="mb-10">
            <h2 className="text-4xl font-extrabold text-text-primary mb-2">Welcome back</h2>
            <p className="text-text-secondary">Please enter your details to sign in.</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" />
                Email Address
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="admin@lacowe.co.ke"
                className="w-full border-2 border-border focus:border-accent rounded-input px-4 py-3 outline-none transition-all text-text-primary"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">
                <Lock className="h-3.5 w-3.5" />
                Password
              </label>
              <div className="relative group">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full border-2 border-border focus:border-accent rounded-input px-4 py-3 outline-none transition-all text-text-primary"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="remember" className="rounded border-border text-accent focus:ring-accent" />
                <label htmlFor="remember" className="text-sm text-text-secondary cursor-pointer">Remember for 30 days</label>
              </div>
              <a href="#" className="text-sm font-bold text-accent hover:underline">Forgot password?</a>
            </div>

            <Button
              type="submit"
              loading={pending}
              className="w-full py-4 text-lg"
            >
              Sign In
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-border">
            <p className="text-center text-sm text-text-secondary">
              Don't have an account? <a href="#" className="font-bold text-accent hover:underline">Contact the administrator</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
