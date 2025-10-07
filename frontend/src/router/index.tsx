import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'

import LoginPage from '@/pages/LoginPage.tsx'
import DashboardPage from '@/pages/DashboardPage'
import UnauthorizedPage from '@/pages/UnauthorizedPage'
import NotFoundPage from '@/pages/NotFoundPage'
import OfflinePage from '@/pages/OfflinePage'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import AppShell from '@/components/layout/AppShell'

import OrdersListPage from '@/pages/orders/OrdersListPage'
import CreateOrderPage from '@/pages/orders/CreateOrderPage'
import OrderDetailPage from '@/pages/orders/OrderDetailPage'
import KanbanBoardPage from '@/pages/orders/KanbanBoardPage'
import DeliveryListPage from '@/pages/orders/DeliveryListPage'
import ApprovalCenterPage from '@/pages/approvals/ApprovalCenterPage'
import UsersManagementPage from '@/pages/users/UsersManagementPage'
import ReportsPage from '@/pages/reports/ReportsPage'
import AuditTrailPage from '@/pages/audit/AuditTrailPage'
import MasterDataPage from '@/pages/admin/MasterDataPage.tsx'

import { useAuthStore } from '@/stores/auth.store'

/**
 * OrdersRouteWrapper
 * Memilih tampilan orders berdasarkan peran:
 * - dapur: KanbanBoardPage
 * - delivery: DeliveryListPage
 * - lainnya (administrator, employee): OrdersListPage
 */
function OrdersRouteWrapper() {
  const user = useAuthStore((s) => s.user)
  switch (user?.role) {
    case 'dapur':
      return <KanbanBoardPage />
    case 'delivery':
      return <DeliveryListPage />
    default:
      return <OrdersListPage />
  }
}

/**
 * Router configuration
 * - Public routes:
 *   - /login
 *   - /unauthorized
 * - Protected routes under /:
 *   - index redirect to /dashboard
 *   - /dashboard
 *   - /orders
 *   - /orders/new
 *   - /users
 *   - /master-data
 *   - /approvals
 *   - /reports
 *   - /audit
 *   - /admin/approvals
 *   - /orders/queue
 *   - /orders/pending-approvals
 *   - /delivery/ready
 * - Fallback:
 *   - * => NotFoundPage
 */
export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'orders',
        element: <OrdersRouteWrapper />,
      },
      {
        path: 'orders/new',
        element: (
          <ProtectedRoute allowedRoles={['employee']}>
            <CreateOrderPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'orders/:id',
        element: <OrderDetailPage />,
      },
      {
        path: 'users',
        element: (
          <ProtectedRoute allowedRoles={['administrator']}>
            <UsersManagementPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'master-data',
        element: (
          <ProtectedRoute allowedRoles={['administrator']}>
            <MasterDataPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'approvals',
        element: (
          <ProtectedRoute allowedRoles={['administrator', 'dapur']}>
            <ApprovalCenterPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'reports',
        element: (
          <ProtectedRoute allowedRoles={['administrator']}>
            <ReportsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'audit',
        element: (
          <ProtectedRoute allowedRoles={['administrator']}>
            <AuditTrailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/approvals',
        element: (
          <ProtectedRoute allowedRoles={['administrator']}>
            <ApprovalCenterPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'orders/queue',
        element: (
          <ProtectedRoute allowedRoles={['dapur']}>
            <KanbanBoardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'orders/pending-approvals',
        element: (
          <ProtectedRoute allowedRoles={['administrator', 'dapur']}>
            <ApprovalCenterPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'delivery/ready',
        element: <DeliveryListPage />,
      },
    ],
  },
  {
    path: '/unauthorized',
    element: <UnauthorizedPage />,
  },
  {
    path: '/offline',
    element: <OfflinePage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])

/**
 * AppRouter component
 * Renders the RouterProvider with the configured router.
 */
export function AppRouter() {
  return <RouterProvider router={router} />
}

export default router