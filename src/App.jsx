import { Routes, Route } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import { HomePage } from './pages/HomePage'
import { ProductDetailPage } from './pages/ProductDetailPage'

export default function App() {
  return (
    <CartProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
      </Routes>
    </CartProvider>
  )
}
