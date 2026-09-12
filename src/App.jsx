import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Signup from './pages/Signup'
import StudentDashboard from './pages/StudentDashboard'
import AdminDashboard from './pages/AdminDashboard'

function HomeRedirect() {
  const { user, isAdmin, loading } = useAuth()
  if (loading) return <div className="container" style={{ padding: '60px 20px' }}>Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />
}

function Layout({ children }) {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="page">{children}</main>
    </div>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/"
        element={
          <Layout>
            <HomeRedirect />
          </Layout>
        }
      />
      <Route
        path="/dashboard"
        element={
          <Layout>
            <ProtectedRoute>
              <StudentDashboard />
            </ProtectedRoute>
          </Layout>
        }
      />
      <Route
        path="/admin"
        element={
          <Layout>
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          </Layout>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
