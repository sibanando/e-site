import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Admin from './pages/Admin';
import UserProfile from './pages/UserProfile';
import SellerDashboard from './pages/SellerDashboard';
import StaticPage from './pages/StaticPage';
import ProductDetail from './pages/ProductDetail';

function App() {
  const location = useLocation();
  const isAdmin = location.pathname === '/admin' || location.pathname === '/seller';

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/seller" element={<SellerDashboard />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/page/:slug" element={<StaticPage />} />
      </Routes>
      {!isAdmin && <Footer />}
    </>
  );
}

export default App;
