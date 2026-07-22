import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ShopProvider } from './context/ShopContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Wishlist from './pages/Wishlist';
import Orders from './pages/Orders';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminLayout from './pages/Admin/AdminLayout';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminProducts from './pages/Admin/AdminProducts';
import AdminSettings from './pages/Admin/AdminSettings';

function App() {
  return (
    <ShopProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          
          <Route path="/checkout" element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          } />
          
          <Route path="/wishlist" element={
            <ProtectedRoute>
              <Wishlist />
            </ProtectedRoute>
          } />
          
          
          <Route path="/orders" element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute requireAdmin={true}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Routes>
        <Navbar />
      </BrowserRouter>
    </ShopProvider>
  );
}

export default App;
