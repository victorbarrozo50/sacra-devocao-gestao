import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Vendas from './pages/Vendas'
import Bordados from './pages/Bordados'
import Fornecedores from './pages/Fornecedores'
import Produtos from './pages/Produtos'
import Compras from './pages/Compras'
import Simulador from './pages/Simulador'
import HubFinanceiro from './pages/HubFinanceiro'
import CRM from './pages/CRM'
import Eventos from './pages/Eventos'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="crm" element={<CRM />} />
          <Route path="eventos" element={<Eventos />} />
          <Route path="vendas" element={<Vendas />} />
          <Route path="bordados" element={<Bordados />} />
          <Route path="fornecedores" element={<Fornecedores />} />
          <Route path="produtos" element={<Produtos />} />
          <Route path="compras" element={<Compras />} />
          <Route path="simulador" element={<Simulador />} />
          <Route path="financeiro" element={<HubFinanceiro />} />
          <Route path="custos" element={<Navigate to="/financeiro" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
