import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedRoute({ redirectPath = '/' }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-300">
        Checking your access…
      </div>
    )
  }

  if (!user) {
    return <Navigate to={redirectPath} replace />
  }

  return <Outlet />
}
