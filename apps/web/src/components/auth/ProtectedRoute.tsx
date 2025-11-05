'use client'

import { useEffect, type ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Spinner } from '@/components/ui/spinner'

interface ProtectedRouteProps {
  children: ReactNode
  adminOnly?: boolean
  moderatorOnly?: boolean
  requireKYC?: boolean
}

export function ProtectedRoute({
  children,
  adminOnly = false,
  moderatorOnly = false,
  requireKYC = false
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
      // Redirect to login with return URL
      navigate('/login', {
        state: { returnTo: location.pathname },
        replace: true
      })
      return
    }

    // Check role-based access
    if (adminOnly && user?.role !== 'admin') {
      navigate('/unauthorized', { replace: true })
      return
    }

    if (moderatorOnly && !['admin', 'moderator'].includes(user?.role || '')) {
      navigate('/unauthorized', { replace: true })
      return
    }

    // Check KYC requirement
    if (requireKYC && user?.kycStatus !== 'verified') {
      navigate('/kyc/required', { replace: true })
      return
    }
  }, [isAuthenticated, isLoading, user, adminOnly, moderatorOnly, requireKYC, navigate, location])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (adminOnly && user?.role !== 'admin') {
    return null
  }

  if (moderatorOnly && !['admin', 'moderator'].includes(user?.role || '')) {
    return null
  }

  if (requireKYC && user?.kycStatus !== 'verified') {
    return null
  }

  return <>{children}</>
}
