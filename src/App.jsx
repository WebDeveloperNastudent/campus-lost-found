import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import VerifyDevice from './pages/VerifyDevice'
import StudentDashboard from './pages/StudentDashboard'
import AdminDashboard from './pages/AdminDashboard'
import AdminReports from './pages/AdminReports'
import FoundItemsBoard from './pages/FoundItemsBoard'
import LostItemsBoard from './pages/LostItemsBoard'
import NotFound from './pages/NotFound'

function Home() {
  const { user, isAdmin, loading } = useAuth()
  if (loading) return <div className="container" style={{ padding: '60px 20px' }}>Loading...</div>
  if (!user) return <Landing />
  return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />
}

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return (
    <div className="app-shell-sidebar">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="dashboard-main">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="page">{children}</main>
      </div>
    </div>
  )
}

function AppRoutes() {
  const location = useLocation()
  return (
    <div key={location.pathname} className="page-transition">
      <Routes location={location}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-device" element={<VerifyDevice />} />
        <Route path="/" element={<Home />} />
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
        <Route
          path="/admin/reports"
          element={
            <Layout>
              <ProtectedRoute adminOnly>
                <AdminReports />
              </ProtectedRoute>
            </Layout>
          }
        />
        <Route
          path="/board"
          element={
            <Layout>
              <ProtectedRoute>
                <FoundItemsBoard />
              </ProtectedRoute>
            </Layout>
          }
        />
        <Route
          path="/lost-board"
          element={
            <Layout>
              <ProtectedRoute>
                <LostItemsBoard />
              </ProtectedRoute>
            </Layout>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}