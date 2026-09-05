import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoginPage from './features/auth/LoginPage';
import RegisterPage from './features/auth/RegisterPage';
import CustomerAuthPage from './features/auth/CustomerAuthPage';
import DashboardPage from './features/dashboard/DashboardPage';
import HomePage from './features/home/HomePage';
import FloorsPage from './features/floors/FloorsPage';
import SeatMapPage from './features/seatmap/SeatMapPage';
import FacilitiesPage from './features/facilities/FacilitiesPage';
import PhotosPage from './features/photos/PhotosPage';
import CustomersPage from './features/customers/CustomersPage';
import OrdersPage from './features/orders/OrdersPage';
import ProfilePage from './features/profile/ProfilePage';
import PublicLibraryPage from './features/public/PublicLibraryPage';
import LibrariesListPage from './features/public/LibrariesListPage';
import CustomerHomePage from './features/customer/CustomerHomePage';
import EnrolledPage from './features/customer/EnrolledPage';
import CustomerOrdersPage from './features/customer/CustomerOrdersPage';
import NotificationsPage from './features/customer/NotificationsPage';
import CustomerProfilePage from './features/customer/CustomerProfilePage';
import CustomerLayout from './layouts/CustomerLayout';
import OwnerLayout from './layouts/OwnerLayout';
import AdminLayout from './layouts/AdminLayout';
import AdminOverviewPage from './features/admin/AdminOverviewPage';
import AdminLibrariesPage from './features/admin/AdminLibrariesPage';
import AdminLibraryDetailPage from './features/admin/AdminLibraryDetailPage';
import AdminCustomersPage from './features/admin/AdminCustomersPage';

function RequireAuth({ children }) {
  const token = useSelector((s) => s.auth.token);
  return token ? children : <Navigate to="/login" replace />;
}

function RequireCustomer({ children }) {
  const token = useSelector((s) => s.auth.token);
  const role = useSelector((s) => s.auth.user?.role);
  if (!token) return <Navigate to="/login" replace />;
  if (role !== 'CUSTOMER') return <Navigate to="/dashboard" replace />;
  return children;
}

function RequireAdmin({ children }) {
  const token = useSelector((s) => s.auth.token);
  const role = useSelector((s) => s.auth.user?.role);
  if (!token) return <Navigate to="/login" replace />;
  if (role !== 'SUPER_ADMIN') return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/libraries" element={<LibrariesListPage />} />
        <Route path="/l/:slug" element={<PublicLibraryPage />} />
        <Route path="/customer-auth" element={<CustomerAuthPage />} />
        <Route
          path="/customer"
          element={
            <RequireCustomer>
              <CustomerLayout />
            </RequireCustomer>
          }
        >
          <Route path="home" element={<CustomerHomePage />} />
          <Route path="enrolled" element={<EnrolledPage />} />
          <Route path="orders" element={<CustomerOrdersPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<CustomerProfilePage />} />
        </Route>
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <OwnerLayout />
            </RequireAuth>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="floors" element={<FloorsPage />} />
          <Route path="seat-map" element={<SeatMapPage />} />
          <Route path="facilities" element={<FacilitiesPage />} />
          <Route path="photos" element={<PhotosPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<AdminOverviewPage />} />
          <Route path="libraries" element={<AdminLibrariesPage />} />
          <Route path="libraries/:libraryId" element={<AdminLibraryDetailPage />} />
          <Route path="customers" element={<AdminCustomersPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
