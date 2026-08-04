import React, { useContext } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ShopProvider, ShopContext } from './context/ShopContext';
import Navbar from './components/Navbar';
import TopBar from './components/TopBar';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Wishlist from './pages/Wishlist';
import Account from './pages/Account';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Contact from './pages/Contact';
import StoreInfo from './pages/StoreInfo';
import Categories from './pages/Categories';
import Admin from './pages/Admin';
import SplashScreen from './components/SplashScreen';
import SwipeNavigator from './components/SwipeNavigator';
import Maintenance from './components/Maintenance';

function MainAppContent() {
  const { storeSettings } = useContext(ShopContext);

  if (storeSettings?.isMaintenanceMode) {
    return <Maintenance storeSettings={storeSettings} />;
  }

  return (
    <HashRouter>
      <SwipeNavigator>
        <TopBar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/account" element={<Account />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/store-info" element={<StoreInfo />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Home />} />
        </Routes>
        <Navbar />
        <WhatsAppButton />
      </SwipeNavigator>
    </HashRouter>
  );
}

function App() {
  return (
    <ShopProvider>
      <SplashScreen />
      <MainAppContent />
    </ShopProvider>
  );
}

export default App;
