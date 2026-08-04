import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu, Bell } from 'lucide-react'
import Sidebar from './Sidebar'

const TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/vendas': 'Vendas',
  '/bordados': 'Bordados & Designs',
  '/fornecedores': 'Fornecedores',
  '/produtos': 'Produtos & SKUs',
  '/compras': 'Registro de Compras',
  '/simulador': 'Simulador de Preço',
  '/financeiro': 'Hub Financeiro',
  '/crm': 'CRM · Clientes',
  '/eventos': 'Eventos & Calendário',
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { pathname } = useLocation()
  const title = TITLES[pathname] ?? 'Sacra Devoção'

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--sacra-cream)' }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header
          className="flex items-center gap-3 px-5 py-3.5 border-b flex-shrink-0"
          style={{
            background: 'white',
            borderColor: 'var(--sacra-sand)',
            boxShadow: '0 1px 4px rgba(62,42,27,0.05)',
          }}
        >
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-sacra-cream text-sacra-coffee"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>

          <div className="flex-1">
            <h1 className="font-heading text-xl font-semibold" style={{ color: 'var(--sacra-coffee)' }}>
              {title}
            </h1>
          </div>

          <button className="p-2 rounded-lg hover:bg-sacra-cream" style={{ color: 'var(--sacra-brown)' }}>
            <Bell size={18} />
          </button>

          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
            style={{ background: 'var(--sacra-gold)' }}
          >
            SD
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-5 max-w-screen-xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
