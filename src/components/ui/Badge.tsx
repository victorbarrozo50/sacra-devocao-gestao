import type { StatusCompra } from '../../types'

// ABC Badge
export function ABCBadge({ value }: { value: 'A' | 'B' | 'C' }) {
  return (
    <span className={`badge-${value.toLowerCase()} inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold`}>
      Curva {value}
    </span>
  )
}

// Status Compra Badge
const statusMap: Record<StatusCompra, { label: string; cls: string }> = {
  aguardando:         { label: 'Aguardando', cls: 'status-aguardando' },
  compra_solicitada:  { label: 'Compra Solicitada', cls: 'status-solicitada' },
  produto_recebido:   { label: 'Produto Recebido', cls: 'status-recebido' },
  bordado_em_andamento:{ label: 'Bordando', cls: 'status-bordando' },
  concluido:          { label: 'Concluído', cls: 'status-concluido' },
  cancelado:          { label: 'Cancelado', cls: 'status-cancelado' },
}

export function StatusCompraBadge({ status }: { status: StatusCompra }) {
  const { label, cls } = statusMap[status] ?? { label: status, cls: 'status-aguardando' }
  return (
    <span className={`${cls} inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium`}>
      {label}
    </span>
  )
}

// Canal Badge
export function CanalBadge({ canal }: { canal: 'varejo' | 'atacado' }) {
  return canal === 'varejo' ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: '#F0E8D820', color: '#7A5828', border: '1px solid #C0955A40' }}>
      Varejo
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: '#3E2A1B15', color: '#3E2A1B', border: '1px solid #C0955A50' }}>
      Atacado
    </span>
  )
}

// Pagamento Badge
export function PgBadge({ forma }: { forma: 'cartao' | 'pix' | 'dinheiro' }) {
  const map = {
    cartao:   { label: 'Cartão', bg: '#EDE9FE', color: '#6D28D9', border: '#DDD6FE' },
    pix:      { label: 'PIX', bg: '#D1FAE5', color: '#065F46', border: '#A7F3D0' },
    dinheiro: { label: 'Dinheiro', bg: '#FEF3C7', color: '#92400E', border: '#FDE68A' },
  }
  const { label, bg, color, border } = map[forma]
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: bg, color, border: `1px solid ${border}` }}>
      {label}
    </span>
  )
}
