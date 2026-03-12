import { createBrowserRouter } from 'react-router-dom';
import CustomerLayout from '../layouts/CustomerLayout';
import AdminLayout from '../layouts/AdminLayout';
import ProtectedRoute from '../components/ProtectedRoute';

// Auth Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';

// Storefront placeholders
import Home from '../pages/customer/Home';
import ProductList from '../pages/customer/ProductList';
import ProductDetails from '../pages/customer/ProductDetails';
import Cart from '../pages/customer/Cart';
import Favorites from '../pages/customer/Favorites';

// Customer Protected Pages
import Profile from '../pages/customer/Profile';
import MyOrders from '../pages/customer/MyOrders';
import Checkout from '../pages/customer/Checkout';

// Admin placeholders
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminProducts from '../pages/admin/Products';
import AdminCategories from '../pages/admin/Categories';
import AdminOrders from '../pages/admin/Orders';
import AdminCoupons from '../pages/admin/Coupons';
import AdminBanners from '../pages/admin/Banners';
import AdminUsers from '../pages/admin/Users';
import AdminSettings from '../pages/admin/Settings';
import ProductForm from '../pages/admin/ProductForm';
import OptionTemplates from '../pages/admin/OptionTemplates';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/register',
    element: <Register />
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />
  },
  {
    path: '/',
    element: <CustomerLayout />,
    children: [
      {
        index: true,
        element: <Home />
      },
      {
        path: 'products',
        element: <ProductList />
      },
      {
        path: 'product/:id',
        element: <ProductDetails />
      },
      {
        path: 'cart',
        element: (
          <ProtectedRoute>
            <Cart />
          </ProtectedRoute>
        )
      },
      {
        path: 'favorites',
        element: (
          <ProtectedRoute>
            <Favorites />
          </ProtectedRoute>
        )
      },
      {
        path: 'checkout',
        element: (
          <ProtectedRoute>
            <Checkout />
          </ProtectedRoute>
        )
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        )
      },
      {
        path: 'my-orders',
        element: (
          <ProtectedRoute>
            <MyOrders />
          </ProtectedRoute>
        )
      }
    ]
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute requireAdmin={true}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <AdminDashboard />
      },
      {
        path: 'products',
        element: <AdminProducts />
      },
      {
        path: 'categories',
        element: <AdminCategories />
      },
      {
        path: 'banners',
        element: <AdminBanners />
      },
      {
        path: 'products/new',
        element: <ProductForm />
      },
      {
        path: 'products/edit/:id',
        element: <ProductForm />
      },
      {
        path: 'orders',
        element: <AdminOrders />
      },
      {
        path: 'coupons',
        element: <AdminCoupons />
      },
      {
        path: 'option-templates',
        element: <OptionTemplates />
      },
      {
        path: 'users',
        element: <AdminUsers />
      },
      {
        path: 'settings',
        element: <AdminSettings />
      }
    ]
  }
]);
