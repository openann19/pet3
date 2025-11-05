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
    if (adminOnly && !user?.roles.includes('admin')) {
      navigate('/unauthorized', { replace: true })
      return
    }

    if (moderatorOnly && !user?.roles.some(role => ['admin', 'moderator'].includes(role))) {
      navigate('/unauthorized', { replace: true })
      return
    }

    // Note: kycStatus is not in User type - check if verification is needed via a separate API call or remove this check
    // For now, commenting out until we add kycStatus to User interface or create a separate verification check
    if (requireKYC) {
      // TODO: Implement KYC status check via API or add kycStatus to User type
      // navigate('/kyc/required', { replace: true })
      // return
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

  if (adminOnly && !user?.roles.includes('admin')) {
    return null
  }

  if (moderatorOnly && !user?.roles.some(role => ['admin', 'moderator'].includes(role))) {
    return null
  }

  // TODO: Implement KYC status check
  if (requireKYC) {
    // return null
  }

  return <>{children}</>
}
