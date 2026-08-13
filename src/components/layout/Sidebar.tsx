import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  ShoppingCart,
  Sparkles,
  Truck,
  Package,
  Calculator,
  BarChart3,
  Users,
  CalendarDays,
  X,
  Receipt,
  Archive,
  UserCog,
  FileBarChart2,
} from 'lucide-react'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/crm', label: 'CRM · Clientes', icon: Users },
  { to: '/eventos', label: 'Eventos', icon: CalendarDays },
  { to: '/vendas', label: 'Vendas', icon: ShoppingCart },
  { to: '/bordados', label: 'Bordados', icon: Sparkles },
  { to: '/fornecedores', label: 'Fornecedores', icon: Truck },
  { to: '/produtos', label: 'Produtos & SKUs', icon: Package },
  { to: '/compras', label: 'Compras', icon: Receipt },
  { to: '/estoque', label: 'Estoque', icon: Archive },
  { to: '/simulador', label: 'Simulador de Preço', icon: Calculator },
  { to: '/financeiro', label: 'Hub Financeiro', icon: BarChart3 },
  { to: '/membros', label: 'Membros & Equipe', icon: UserCog },
  { to: '/relatorios', label: 'Relatórios', icon: FileBarChart2 },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-40 w-64 flex flex-col
          transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{ background: 'var(--sacra-coffee-dark)' }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
          <div className="flex flex-col">
            <span
              className="font-heading text-xl font-semibold tracking-wide"
              style={{ color: 'var(--sacra-gold-light)' }}
            >
              Sacra Devoção
            </span>
            <span className="text-xs font-body mt-0.5" style={{ color: 'var(--sacra-sand)', opacity: 0.6 }}>
              Gestão Operacional
            </span>
          </div>
          <button
            className="lg:hidden p-1 rounded text-white/50 hover:text-white"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Cross ornament */}
        <div className="flex items-center justify-center py-3">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 2 L14 26 M6 10 L22 10" stroke="#C0955A" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="14" cy="5" r="2.5" fill="#C0955A" opacity="0.6"/>
          </svg>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 pb-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
              onClick={() => window.innerWidth < 1024 && onClose()}
            >
              <Icon size={16} className="nav-icon flex-shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

      </aside>
    </>
  )
}
