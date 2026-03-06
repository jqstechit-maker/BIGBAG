import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Truck, 
  Users, 
  Warehouse, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  ClipboardList, 
  LogOut, 
  Plus, 
  Search,
  TrendingUp,
  DollarSign,
  Weight,
  AlertTriangle,
  CheckCircle2,
  MoreVertical,
  Pencil,
  Trash2,
  FileText,
  Download,
  LayoutGrid,
  List,
  RotateCcw
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

// --- Mock Data Initial State ---
const INITIAL_PRODUTOS = [
  { id: 1, codigo: 'VT-0048', descricao: 'BigBag 90x90x120', tipo: 'Fardo', fornecedorId: 1, galpaoId: 1, estoque: 150, min: 50, pesoUnit: 1.2, valorUnit: 45.50 },
  { id: 2, codigo: 'VT-0052', descricao: 'BigBag 100x100x140', tipo: 'Fardo', fornecedorId: 2, galpaoId: 1, estoque: 80, min: 100, pesoUnit: 1.5, valorUnit: 52.00 },
  { id: 3, codigo: 'VT-0089', descricao: 'Bobina Plástica 1200mm', tipo: 'Bobina', fornecedorId: 1, galpaoId: 2, estoque: 25, min: 10, pesoUnit: 45.0, valorUnit: 380.00 },
];

const INITIAL_FORNECEDORES = [
  { id: 1, nome: 'Plásticos S.A', telefone: '(11) 9999-8888', email: 'contato@plasticos.com' },
  { id: 2, nome: 'Têxtil Brasil', telefone: '(21) 8888-7777', email: 'vendas@textil.com.br' },
];

const INITIAL_GALPOES = [
  { id: 1, nome: 'Galpão A', descricao: 'Armazenamento de Leves' },
  { id: 2, nome: 'Galpão B', descricao: 'Produtos Pesados' },
];

const INITIAL_FUNCIONARIOS = [
  { id: 1, nome: 'João Silva', email: 'admin@admin.com', registro: '001', funcao: 'Almoxarife', nivel: 'admin', senha: 'admin' },
  { id: 2, nome: 'Maria Souza', email: 'maria@empresa.com', registro: '002', funcao: 'Operador', nivel: 'funcionario', senha: '123' },
];

const INITIAL_MOVIMENTACOES = [
  { id: 1, data: '01/03/2026, 10:00:00', codigo: 'VT-0048', produto: 'BigBag 90x90x120', fornecedor: 'Plásticos S.A', tipo: 'entrada', qtd: 100, peso: 120, nf: '12345', responsavel: 'João Silva', valorUnit: 45.50, valorTotal: 4550.00, produtoId: 1 },
  { id: 2, data: '02/03/2026, 14:30:00', codigo: 'VT-0052', produto: 'BigBag 100x100x140', fornecedor: 'Têxtil Brasil', tipo: 'saida', qtd: 20, peso: 30, nf: '54321', responsavel: 'Maria Souza', valorUnit: 52.00, valorTotal: 1040.00, produtoId: 2 },
];

const INITIAL_MOVIMENTACOES_INTERNAS = [
  { id: 1, data: '03/03/2026, 09:15:00', codigo: 'VT-0048', produto: 'BigBag 90x90x120', tipo: 'Produção', qtd: 10, peso: 12, responsavel: 'João Silva', destino: 'Linha 1', valorUnit: 45.50, valorTotal: 455.00, produtoId: 1 },
];

// --- Components ---

const Modal = ({ title, children, onClose, onSave }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
    >
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h3 className="text-xl font-bold text-slate-800">{title}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <LogOut className="w-5 h-5 rotate-90" />
        </button>
      </div>
      <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
        {children}
      </div>
      <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3">
        <button onClick={onClose} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors">Cancelar</button>
        <button onClick={onSave} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all">Salvar</button>
      </div>
    </motion.div>
  </div>
);

const GenericTable = ({ headers, data, onEdit, onDelete, renderRow }) => {
  const safeData = Array.isArray(data) ? data : [];
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
            <tr>
              {headers.map(h => <th key={h} className="px-6 py-4">{h}</th>)}
              <th className="px-6 py-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {safeData.map((item, idx) => (
              <tr key={item.id || idx} className="hover:bg-slate-50 transition-colors">
                {renderRow(item)}
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center space-x-2">
                    <button onClick={() => onEdit(item)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(item.id, item)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {safeData.length === 0 && (
              <tr><td colSpan={headers.length + 1} className="px-6 py-10 text-center text-slate-400">Nenhum registro encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600 rounded-full blur-[120px]" />
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative z-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-600/20">
            <Warehouse className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">VIRTUDE BIGBAG'S</h1>
          <p className="text-slate-400">Controle de Estoque & Logística (Modo Preview)</p>
        </div>
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); onLogin(username, password); }}>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Usuário</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Senha</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" 
            />
          </div>
          <div className="flex flex-col gap-3">
            <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all transform active:scale-[0.98]">Acessar Sistema</button>
          </div>
        </form>
        <p className="mt-8 text-center text-slate-500 text-sm">By <a href="https://www.jqstechit.com.br" target="_blank" rel="noopener noreferrer" className="font-bold text-blue-400 hover:underline">JqsTechit</a> 2026</p>
      </motion.div>
    </div>
  );
};

const SidebarItem = ({ icon: Icon, label, active, onClick, badge = null }) => (
  <button onClick={onClick} className={`w-full flex items-center px-4 py-3 text-sm font-medium transition-colors rounded-lg mb-1 ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
    <Icon className={`w-5 h-5 mr-3 ${active ? 'text-white' : 'text-slate-500'}`} />
    <span className="flex-1 text-left">{label}</span>
    {badge && <span className="px-2 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full">{badge}</span>}
  </button>
);

const StatCard = ({ title, value, icon: Icon, color, trend = null }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl ${color}`}>{Icon && <Icon className="w-6 h-6 text-white" />}</div>
      {trend !== null && trend !== undefined && (
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${Number(trend) > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {Number(trend) > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
    <p className="text-2xl font-bold text-slate-900">{value}</p>
  </div>
);

const FilterBar = ({ fields, filters, onFilterChange, onClear, fornecedores, funcionarios, activeTab }) => (
  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-6 flex flex-wrap gap-4 items-end">
    {fields.includes('data') && (
      <div className="flex-1 min-w-[150px]">
        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Data</label>
        <input type="date" className="w-full p-2 bg-slate-50 border rounded-lg text-xs" value={filters.data} onChange={e => onFilterChange('data', e.target.value)} />
      </div>
    )}
    {fields.includes('codigo') && (
      <div className="flex-1 min-w-[150px]">
        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Código</label>
        <input placeholder="Ex: VT-0048" className="w-full p-2 bg-slate-50 border rounded-lg text-xs" value={filters.codigo} onChange={e => onFilterChange('codigo', e.target.value)} />
      </div>
    )}
    {fields.includes('descricao') && (
      <div className="flex-1 min-w-[150px]">
        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Descrição</label>
        <input placeholder="Buscar..." className="w-full p-2 bg-slate-50 border rounded-lg text-xs" value={filters.descricao} onChange={e => onFilterChange('descricao', e.target.value)} />
      </div>
    )}
    {fields.includes('tipo') && (
      <div className="flex-1 min-w-[150px]">
        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tipo</label>
        <select className="w-full p-2 bg-slate-50 border rounded-lg text-xs" value={filters.tipo} onChange={e => onFilterChange('tipo', e.target.value)}>
          <option value="">Todos</option>
          {activeTab === 'internas' ? (
            <>
              <option value="Produção">Produção</option>
              <option value="Transferência">Transferência</option>
            </>
          ) : (
            <>
              <option value="Bobina">Bobina</option>
              <option value="Fardo">Fardo</option>
              <option value="Caixa">Caixa</option>
              <option value="Pallet">Pallet</option>
              <option value="Pacote">Pacote</option>
              <option value="Rolo">Rolo</option>
            </>
          )}
        </select>
      </div>
    )}
    {fields.includes('fornecedor') && (
      <div className="flex-1 min-w-[150px]">
        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Fornecedor</label>
        <select className="w-full p-2 bg-slate-50 border rounded-lg text-xs" value={filters.fornecedor} onChange={e => onFilterChange('fornecedor', e.target.value)}>
          <option value="">Todos</option>
          {fornecedores.map(f => <option key={f.id} value={f.nome}>{f.nome}</option>)}
        </select>
      </div>
    )}
    {fields.includes('nf') && (
      <div className="flex-1 min-w-[150px]">
        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">NF</label>
        <input placeholder="Nº Nota" className="w-full p-2 bg-slate-50 border rounded-lg text-xs" value={filters.nf} onChange={e => onFilterChange('nf', e.target.value)} />
      </div>
    )}
    {fields.includes('responsavel') && (
      <div className="flex-1 min-w-[150px]">
        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Responsável</label>
        <select className="w-full p-2 bg-slate-50 border rounded-lg text-xs" value={filters.responsavel} onChange={e => onFilterChange('responsavel', e.target.value)}>
          <option value="">Todos</option>
          {funcionarios.map(f => <option key={f.id} value={f.nome}>{f.nome}</option>)}
        </select>
      </div>
    )}
    <button onClick={onClear} className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Limpar Filtros">
      <Trash2 className="w-5 h-5" />
    </button>
  </div>
);

const Dashboard = ({ produtos = [], movimentacoes = [], movimentacoesInternas = [] }) => {
  const safeProdutos = Array.isArray(produtos) ? produtos : [];
  const safeMovimentacoes = Array.isArray(movimentacoes) ? movimentacoes : [];
  const safeMovimentacoesInternas = Array.isArray(movimentacoesInternas) ? movimentacoesInternas : [];

  const totalEstoqueQtd = safeProdutos.reduce((acc, p) => acc + (Number(p.estoque) || 0), 0);
  const totalEstoqueValor = safeProdutos.reduce((acc, p) => acc + ((Number(p.estoque) || 0) * (Number(p.valorUnit) || 0)), 0);
  
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const datePart = dateStr.split(' ')[0].split(',')[0];
    if (datePart.includes('/')) {
      const [d, m, y] = datePart.split('/');
      return { month: parseInt(m) - 1, year: parseInt(y) };
    } else if (datePart.includes('-')) {
      const parts = datePart.split('-');
      if (parts[0].length === 4) { // YYYY-MM-DD
        return { month: parseInt(parts[1]) - 1, year: parseInt(parts[0]) };
      } else { // DD-MM-YYYY
        return { month: parseInt(parts[1]) - 1, year: parseInt(parts[2]) };
      }
    }
    return null;
  };

  const filterByMonth = (m) => {
    const parsed = parseDate(m?.data);
    if (!parsed) return false;
    return parsed.month === currentMonth && parsed.year === currentYear;
  };

  const movimentosMes = safeMovimentacoes.filter(filterByMonth);
  const movimentosInternosMes = safeMovimentacoesInternas.filter(filterByMonth);

  const entradasMesQtd = movimentosMes.filter(m => m.tipo === 'entrada' || m.tipo === 'devolucao').reduce((acc, m) => acc + (Number(m.qtd) || 0), 0);
  const entradasMesVal = movimentosMes.filter(m => m.tipo === 'entrada' || m.tipo === 'devolucao').reduce((acc, m) => acc + (Number(m.valorTotal) || 0), 0);
  
  const saidasMesQtd = 
    movimentosMes.filter(m => m.tipo === 'saida').reduce((acc, m) => acc + (Number(m.qtd) || 0), 0) + 
    movimentosInternosMes.reduce((acc, m) => acc + (Number(m.qtd) || 0), 0);
    
  const saidasMesVal = 
    movimentosMes.filter(m => m.tipo === 'saida').reduce((acc, m) => acc + (Number(m.valorTotal) || 0), 0) +
    movimentosInternosMes.reduce((acc, m) => acc + (Number(m.valorTotal) || 0), 0);

  // Process data for charts (last 6 months)
  const chartData = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const monthName = d.toLocaleString('pt-BR', { month: 'short' });
    const mIndex = d.getMonth();
    const yIndex = d.getFullYear();

    const filterBySpecificMonth = (m) => {
      const parsed = parseDate(m?.data);
      if (!parsed) return false;
      return parsed.month === mIndex && parsed.year === yIndex;
    };

    const monthMovs = safeMovimentacoes.filter(filterBySpecificMonth);
    const monthMovsInt = safeMovimentacoesInternas.filter(filterBySpecificMonth);

    return {
      name: monthName,
      entradasQtd: monthMovs.filter(m => m.tipo === 'entrada' || m.tipo === 'devolucao').reduce((acc, m) => acc + (Number(m.qtd) || 0), 0),
      saidasQtd: monthMovs.filter(m => m.tipo === 'saida').reduce((acc, m) => acc + (Number(m.qtd) || 0), 0) + monthMovsInt.reduce((acc, m) => acc + (Number(m.qtd) || 0), 0),
      entradasVal: monthMovs.filter(m => m.tipo === 'entrada' || m.tipo === 'devolucao').reduce((acc, m) => acc + (Number(m.valorTotal) || 0), 0),
      saidasVal: monthMovs.filter(m => m.tipo === 'saida').reduce((acc, m) => acc + (Number(m.valorTotal) || 0), 0) + monthMovsInt.reduce((acc, m) => acc + (Number(m.valorTotal) || 0), 0),
    };
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Entradas Qtd (Mês)" value={entradasMesQtd.toLocaleString()} icon={ArrowDownCircle} color="bg-blue-500" />
        <StatCard title="Entradas Valor (Mês)" value={`R$ ${entradasMesVal.toFixed(3)}`} icon={DollarSign} color="bg-green-500" />
        <StatCard title="Saídas Qtd (Mês)" value={saidasMesQtd.toLocaleString()} icon={ArrowUpCircle} color="bg-red-500" />
        <StatCard title="Saídas Valor (Mês)" value={`R$ ${saidasMesVal.toFixed(3)}`} icon={DollarSign} color="bg-orange-500" />
        <StatCard title="Valor Total Estoque" value={`R$ ${totalEstoqueValor.toFixed(3)}`} icon={Warehouse} color="bg-amber-500" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">Fluxo de Quantidades</h3>
            <div className="flex items-center space-x-4 text-[10px] font-bold uppercase tracking-widest">
              <div className="flex items-center"><div className="w-3 h-3 bg-blue-500 rounded-sm mr-2"></div> Entradas</div>
              <div className="flex items-center"><div className="w-3 h-3 bg-red-500 rounded-sm mr-2"></div> Saídas</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <Tooltip 
                cursor={{fill: '#f8fafc'}}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
              />
              <Bar dataKey="entradasQtd" name="Entradas (Qtd)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="saidasQtd" name="Saídas (Qtd)" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">Fluxo de Valores (R$)</h3>
            <div className="flex items-center space-x-4 text-[10px] font-bold uppercase tracking-widest">
              <div className="flex items-center"><div className="w-3 h-3 bg-green-500 rounded-sm mr-2"></div> Entradas</div>
              <div className="flex items-center"><div className="w-3 h-3 bg-orange-500 rounded-sm mr-2"></div> Saídas</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(value) => `R$ ${value}`} />
              <Tooltip 
                formatter={(value) => [`R$ ${Number(value).toFixed(3)}`, '']}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
              />
              <Line type="monotone" dataKey="entradasVal" name="Entradas (R$)" stroke="#22c55e" strokeWidth={3} dot={{ r: 4, fill: '#22c55e' }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="saidasVal" name="Saídas (R$)" stroke="#f97316" strokeWidth={3} dot={{ r: 4, fill: '#f97316' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const COLORS = ['#3b82f6', '#22c55e', '#eab308', '#a855f7', '#6b7280'];

// --- Main App Component ---

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('admin');
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [estoqueViewMode, setEstoqueViewMode] = useState('grid');
  
  // UI States
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [filters, setFilters] = useState({
    codigo: '',
    descricao: '',
    tipo: '',
    fornecedor: '',
    responsavel: '',
    nf: '',
    data: ''
  });

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      codigo: '',
      descricao: '',
      tipo: '',
      fornecedor: '',
      responsavel: '',
      nf: '',
      data: ''
    });
  };

  const openAddModal = () => {
    setEditingItem(null);
    const initialData: any = { codigoPrefix: '', codigoSuffix: '' };
    if (activeTab === 'entradas') initialData.tipoMov = 'entrada';
    if (activeTab === 'saidas') initialData.tipoMov = 'saida';
    setFormData(initialData);
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({ ...item });
    setShowModal(true);
  };

  // States for Data
  const [produtos, setProdutos] = useState(INITIAL_PRODUTOS);
  const [fornecedores, setFornecedores] = useState(INITIAL_FORNECEDORES);
  const [galpoes, setGalpoes] = useState(INITIAL_GALPOES);
  const [funcionarios, setFuncionarios] = useState(INITIAL_FUNCIONARIOS);
  const [movimentacoes, setMovimentacoes] = useState(INITIAL_MOVIMENTACOES);
  const [movimentacoesInternas, setMovimentacoesInternas] = useState(INITIAL_MOVIMENTACOES_INTERNAS);

  // Helper para fetch com credenciais e tratamento de erro global
  const apiFetch = async (url: string, options: RequestInit = {}) => {
    const defaultOptions: RequestInit = {
      credentials: 'include',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    const response = await fetch(url, defaultOptions);
    
    if (response.status === 401 && isLoggedIn) {
      setIsLoggedIn(false);
      setCurrentUser(null);
    }
    
    return response;
  };

  const fetchData = async () => {
    // No-op in preview mode
    console.log('FetchData called (Preview Mode)');
  };

  useEffect(() => {
    const checkSession = async () => {
      // In preview mode, we can just check if there's a user in state or skip
    };
    checkSession();
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
    }
  }, [isLoggedIn]);

  const handleLogin = async (username, password) => {
    const user = funcionarios.find(f => (f.email === username || f.nome === username) && f.senha === password);
    if (user) {
      setUserRole(user.nivel);
      setCurrentUser(user);
      setIsLoggedIn(true);
    } else {
      alert('Usuário ou senha incorretos.');
    }
  };

  const handleLogout = async () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este registro?')) return;
    
    if (activeTab === 'estoque' || activeTab === 'produtos') setProdutos(prev => prev.filter(p => p.id !== id));
    else if (activeTab === 'fornecedores') setFornecedores(prev => prev.filter(f => f.id !== id));
    else if (activeTab === 'galpoes') setGalpoes(prev => prev.filter(g => g.id !== id));
    else if (activeTab === 'funcionarios') setFuncionarios(prev => prev.filter(f => f.id !== id));
    else if (activeTab === 'internas') setMovimentacoesInternas(prev => prev.filter(m => m.id !== id));
    else if (activeTab === 'entradas' || activeTab === 'saidas' || activeTab === 'devolucoes') setMovimentacoes(prev => prev.filter(m => m.id !== id));
  };

  const handleSave = async () => {
    const timestamp = new Date().toLocaleString();
    let endpoint = '';
    let payload = { ...formData };
    let prod = null;

    if (activeTab === 'produtos' || activeTab === 'estoque') {
      endpoint = 'produtos';
      const finalCodigo = formData.codigoPrefix && formData.codigoSuffix 
        ? `${formData.codigoPrefix}-${formData.codigoSuffix}` 
        : formData.codigo;
      payload = { ...payload, codigo: finalCodigo };
    } else if (activeTab === 'fornecedores') endpoint = 'fornecedores';
    else if (activeTab === 'galpoes') endpoint = 'galpoes';
    else if (activeTab === 'funcionarios') endpoint = 'funcionarios';
    else if (activeTab === 'internas' || activeTab === 'entradas' || activeTab === 'saidas' || activeTab === 'devolucoes') {
      prod = produtos.find(p => p.id === parseInt(formData.produtoId));
      if (!prod) return;
      const isInternal = formData.tipoMov === 'Produção' || formData.tipoMov === 'Transferência';
      endpoint = isInternal ? 'movimentacoes_internas' : 'movimentacoes';
      
      const valorUnit = (formData.tipoMov === 'entrada' || formData.tipoMov === 'devolucao') ? (parseFloat(formData.valorUnit) || 0) : (prod.valorUnit || 0);
      payload = {
        ...formData,
        data: editingItem ? editingItem.data : timestamp,
        codigo: prod.codigo,
        produto: prod.descricao,
        tipo: formData.tipoMov,
        valorUnit,
        valorTotal: valorUnit * parseInt(formData.quantidade),
        fornecedor: fornecedores.find(f => f.id === prod.fornecedorId)?.nome || 'N/A',
        responsavel: formData.responsavel || currentUser?.nome || 'Admin'
      };
    }

    if (endpoint) {
      const isEdit = !!editingItem;
      const newId = isEdit ? editingItem.id : Date.now();
      const finalPayload = { ...payload, id: newId };

      if (endpoint === 'produtos') {
        setProdutos(prev => isEdit ? prev.map(p => p.id === newId ? finalPayload : p) : [...prev, finalPayload]);
      } else if (endpoint === 'fornecedores') {
        setFornecedores(prev => isEdit ? prev.map(f => f.id === newId ? finalPayload : f) : [...prev, finalPayload]);
      } else if (endpoint === 'galpoes') {
        setGalpoes(prev => isEdit ? prev.map(g => g.id === newId ? finalPayload : g) : [...prev, finalPayload]);
      } else if (endpoint === 'funcionarios') {
        setFuncionarios(prev => isEdit ? prev.map(f => f.id === newId ? finalPayload : f) : [...prev, finalPayload]);
      } else if (endpoint === 'movimentacoes') {
        setMovimentacoes(prev => isEdit ? prev.map(m => m.id === newId ? finalPayload : m) : [...prev, finalPayload]);
      } else if (endpoint === 'movimentacoes_internas') {
        setMovimentacoesInternas(prev => isEdit ? prev.map(m => m.id === newId ? finalPayload : m) : [...prev, finalPayload]);
      }

      // Update product stock if it's a movement
      if (prod) {
        const isEntry = formData.tipoMov === 'entrada' || formData.tipoMov === 'devolucao';
        const isExit = formData.tipoMov === 'saida' || formData.tipoMov === 'Produção' || formData.tipoMov === 'Transferência';
        
        let newStock = prod.estoque;
        if (isEntry) newStock += parseInt(formData.quantidade);
        if (isExit) newStock -= parseInt(formData.quantidade);

        setProdutos(prev => prev.map(p => p.id === prod.id ? { ...p, estoque: newStock } : p));
      }

      setShowModal(false);
    }
  };

  const exportToExcel = (type) => {
    const data = (type === 'internas' ? movimentacoesInternas : movimentacoes)
      .filter(m => {
        if (type === 'internas') return true;
        if (type === 'devolucoes') return m.tipo === 'devolucao';
        return m.tipo === type;
      })
      .map(m => ({
        Data: m.data,
        Código: m.codigo,
        Produto: m.produto,
        Fornecedor: m.fornecedor,
        Quantidade: m.qtd,
        Peso: m.peso,
        NF: m.nf,
        Responsável: m.responsavel,
        'Valor Unitário': m.valorUnit,
        'Valor Total': m.valorTotal
      }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatorio');
    XLSX.writeFile(wb, `Relatorio_${type}.xlsx`);
  };

  const exportToPDF = (type) => {
    const doc = new jsPDF('l');
    const data = (type === 'internas' ? movimentacoesInternas : movimentacoes)
      .filter(m => {
        if (type === 'internas') return true;
        if (type === 'devolucoes') return m.tipo === 'devolucao';
        return m.tipo === type;
      });
    const rows = data.map(m => [m.data, m.codigo, m.produto, m.qtd, m.responsavel, m.valorTotal]);
    autoTable(doc, {
      head: [['Data', 'Código', 'Produto', 'Qtd', 'Responsável', 'Total']],
      body: rows,
    });
    doc.save(`Relatorio_${type}.pdf`);
  };

  if (!isLoggedIn) return <Login onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white p-6 hidden lg:flex flex-col">
        <div className="flex items-center space-x-3 mb-10">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/40">
            <Warehouse className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">VIRTUDE</span>
        </div>
        
        <nav className="flex-1">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <SidebarItem icon={Package} label="Estoque Atual" active={activeTab === 'estoque'} onClick={() => setActiveTab('estoque')} />
          
          <div className="mt-8 mb-4 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Movimentações</div>
          <SidebarItem icon={ArrowDownCircle} label="Entradas" active={activeTab === 'entradas'} onClick={() => setActiveTab('entradas')} />
          <SidebarItem icon={ArrowUpCircle} label="Saídas" active={activeTab === 'saidas'} onClick={() => setActiveTab('saidas')} />
          <SidebarItem icon={RotateCcw} label="Devoluções" active={activeTab === 'devolucoes'} onClick={() => setActiveTab('devolucoes')} />
          <SidebarItem icon={ClipboardList} label="Internas / Produção" active={activeTab === 'internas'} onClick={() => setActiveTab('internas')} />
          
          <div className="mt-8 mb-4 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cadastros</div>
          <SidebarItem icon={Truck} label="Fornecedores" active={activeTab === 'fornecedores'} onClick={() => setActiveTab('fornecedores')} />
          <SidebarItem icon={Warehouse} label="Galpões" active={activeTab === 'galpoes'} onClick={() => setActiveTab('galpoes')} />
          {userRole === 'admin' && (
            <SidebarItem icon={Users} label="Funcionários" active={activeTab === 'funcionarios'} onClick={() => setActiveTab('funcionarios')} />
          )}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800">
          <div className="flex items-center space-x-3 mb-6 px-2">
            <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-xs font-bold">{currentUser?.nome?.[0]}</div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{currentUser?.nome}</p>
              <p className="text-[10px] text-slate-500 uppercase">{userRole}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
            <LogOut className="w-5 h-5 mr-3" />
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 capitalize">{activeTab.replace('_', ' ')}</h2>
            <p className="text-slate-500 text-sm">Bem-vindo ao painel de controle Virtude BigBag's</p>
          </div>
          <div className="flex items-center space-x-3">
            {['estoque', 'fornecedores', 'galpoes', 'funcionarios', 'internas', 'entradas', 'saidas', 'devolucoes'].includes(activeTab) && (
              <button onClick={openAddModal} className="flex items-center px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all transform active:scale-95">
                <Plus className="w-5 h-5 mr-2" />
                Novo Registro
              </button>
            )}
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
            {activeTab === 'dashboard' && <Dashboard produtos={produtos} movimentacoes={movimentacoes} movimentacoesInternas={movimentacoesInternas} />}
            
            {activeTab === 'estoque' && (
              <>
                <FilterBar 
                  fields={['codigo', 'descricao', 'tipo']} 
                  filters={filters} 
                  onFilterChange={handleFilterChange} 
                  onClear={clearFilters} 
                  activeTab={activeTab} 
                  fornecedores={fornecedores}
                  funcionarios={funcionarios}
                />
                <div className="flex justify-end mb-4 space-x-2">
                  <button onClick={() => setEstoqueViewMode('grid')} className={`p-2 rounded-lg ${estoqueViewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-slate-400'}`}><LayoutGrid className="w-5 h-5" /></button>
                  <button onClick={() => setEstoqueViewMode('list')} className={`p-2 rounded-lg ${estoqueViewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-slate-400'}`}><List className="w-5 h-5" /></button>
                </div>
                {estoqueViewMode === 'list' ? (
                  <GenericTable 
                    headers={['Código', 'Descrição', 'Tipo', 'Estoque', 'Mínimo', 'Peso Unit', 'Valor Unit']}
                    data={produtos.filter(p => p.codigo.includes(filters.codigo) && p.descricao.toLowerCase().includes(filters.descricao.toLowerCase()))}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                    renderRow={(p) => (
                      <>
                        <td className="px-6 py-4 font-bold text-blue-600">{p.codigo}</td>
                        <td className="px-6 py-4 text-slate-600">{p.descricao}</td>
                        <td className="px-6 py-4"><span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs">{p.tipo}</span></td>
                        <td className="px-6 py-4"><span className={`font-bold ${p.estoque <= p.min ? 'text-red-500' : 'text-slate-900'}`}>{p.estoque}</span></td>
                        <td className="px-6 py-4 text-slate-400">{p.min}</td>
                        <td className="px-6 py-4 text-slate-600">{p.pesoUnit}kg</td>
                        <td className="px-6 py-4 text-slate-600">R$ {p.valorUnit?.toFixed(2)}</td>
                      </>
                    )}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {produtos.filter(p => p.codigo.includes(filters.codigo) && p.descricao.toLowerCase().includes(filters.descricao.toLowerCase())).map(p => (
                      <div key={p.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-4">
                          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">{p.codigo.slice(-2)}</div>
                          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEditModal(p)} className="p-2 text-slate-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete(p.id)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                        <h4 className="font-bold text-slate-800 mb-1">{p.descricao}</h4>
                        <p className="text-xs text-slate-400 mb-4">{p.codigo} • {p.tipo}</p>
                        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold">Estoque</p>
                            <p className={`text-xl font-bold ${p.estoque <= p.min ? 'text-red-500' : 'text-slate-900'}`}>{p.estoque}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-slate-400 uppercase font-bold">Valor Unit</p>
                            <p className="text-sm font-bold text-slate-600">R$ {p.valorUnit?.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {(activeTab === 'entradas' || activeTab === 'saidas' || activeTab === 'devolucoes') && (
              <>
                <FilterBar 
                  fields={['data', 'codigo', 'descricao', 'fornecedor', 'nf', 'responsavel']} 
                  filters={filters} 
                  onFilterChange={handleFilterChange} 
                  onClear={clearFilters} 
                  activeTab={activeTab} 
                  fornecedores={fornecedores}
                  funcionarios={funcionarios}
                />
                <div className="flex space-x-4 mb-6">
                  <button onClick={() => exportToExcel(activeTab)} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold"><Download className="w-4 h-4 mr-2" /> Excel</button>
                  <button onClick={() => exportToPDF(activeTab)} className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold"><FileText className="w-4 h-4 mr-2" /> PDF</button>
                </div>
                <GenericTable 
                  headers={['Data', 'Código', 'Produto', 'Fornecedor', 'Qtd', 'Peso', 'NF', 'Responsável']}
                  data={movimentacoes.filter(m => (activeTab === 'devolucoes' ? m.tipo === 'devolucao' : m.tipo === activeTab) && 
                    m.codigo.includes(filters.codigo) && 
                    m.produto.toLowerCase().includes(filters.descricao.toLowerCase()) &&
                    (filters.fornecedor === '' || m.fornecedor === filters.fornecedor) &&
                    m.nf.includes(filters.nf) &&
                    (filters.responsavel === '' || m.responsavel === filters.responsavel) &&
                    (filters.data === '' || m.data.includes(filters.data.split('-').reverse().join('/')))
                  )}
                  onEdit={openEditModal}
                  onDelete={handleDelete}
                  renderRow={(m) => (
                    <>
                      <td className="px-6 py-4 text-xs text-slate-500">{m.data}</td>
                      <td className="px-6 py-4 font-bold text-slate-700">{m.codigo}</td>
                      <td className="px-6 py-4 text-slate-600">{m.produto}</td>
                      <td className="px-6 py-4 text-slate-600">{m.fornecedor}</td>
                      <td className="px-6 py-4 font-bold">{m.qtd}</td>
                      <td className="px-6 py-4 text-slate-500">{m.peso}kg</td>
                      <td className="px-6 py-4 text-slate-500">{m.nf}</td>
                      <td className="px-6 py-4 text-slate-600">{m.responsavel}</td>
                    </>
                  )}
                />
              </>
            )}

            {activeTab === 'internas' && (
              <>
                <div className="flex space-x-4 mb-6">
                  <button onClick={() => exportToExcel('internas')} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold"><Download className="w-4 h-4 mr-2" /> Excel</button>
                  <button onClick={() => exportToPDF('internas')} className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold"><FileText className="w-4 h-4 mr-2" /> PDF</button>
                </div>
                <GenericTable 
                  headers={['Data', 'Código', 'Produto', 'Tipo', 'Qtd', 'Responsável', 'Destino']}
                  data={movimentacoesInternas}
                  onEdit={openEditModal}
                  onDelete={handleDelete}
                  renderRow={(m) => (
                    <>
                      <td className="px-6 py-4 text-xs text-slate-500">{m.data}</td>
                      <td className="px-6 py-4 font-bold text-slate-700">{m.codigo}</td>
                      <td className="px-6 py-4 text-slate-600">{m.produto}</td>
                      <td className="px-6 py-4"><span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${m.tipo === 'Produção' ? 'bg-purple-100 text-purple-600' : 'bg-amber-100 text-amber-600'}`}>{m.tipo}</span></td>
                      <td className="px-6 py-4 font-bold">{m.qtd}</td>
                      <td className="px-6 py-4 text-slate-600">{m.responsavel}</td>
                      <td className="px-6 py-4 text-slate-500">{m.destino}</td>
                    </>
                  )}
                />
              </>
            )}

            {activeTab === 'fornecedores' && (
              <GenericTable 
                headers={['Nome', 'Telefone', 'Email']}
                data={fornecedores}
                onEdit={openEditModal}
                onDelete={handleDelete}
                renderRow={(f) => (
                  <>
                    <td className="px-6 py-4 font-bold text-slate-800">{f.nome}</td>
                    <td className="px-6 py-4 text-slate-600">{f.telefone}</td>
                    <td className="px-6 py-4 text-slate-600">{f.email}</td>
                  </>
                )}
              />
            )}

            {activeTab === 'galpoes' && (
              <GenericTable 
                headers={['Nome', 'Descrição']}
                data={galpoes}
                onEdit={openEditModal}
                onDelete={handleDelete}
                renderRow={(g) => (
                  <>
                    <td className="px-6 py-4 font-bold text-slate-800">{g.nome}</td>
                    <td className="px-6 py-4 text-slate-600">{g.descricao}</td>
                  </>
                )}
              />
            )}

            {activeTab === 'funcionarios' && (
              <GenericTable 
                headers={['Nome', 'Email', 'Registro', 'Função', 'Nível']}
                data={funcionarios}
                onEdit={openEditModal}
                onDelete={handleDelete}
                renderRow={(f) => (
                  <>
                    <td className="px-6 py-4 font-bold text-slate-800">{f.nome}</td>
                    <td className="px-6 py-4 text-slate-600">{f.email}</td>
                    <td className="px-6 py-4 text-slate-600">{f.registro}</td>
                    <td className="px-6 py-4 text-slate-600">{f.funcao}</td>
                    <td className="px-6 py-4"><span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${f.nivel === 'admin' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>{f.nivel}</span></td>
                  </>
                )}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Modal */}
      {showModal && (
        <Modal 
          title={editingItem ? 'Editar Registro' : 'Novo Registro'} 
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        >
          {activeTab === 'estoque' || activeTab === 'produtos' ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 flex space-x-2">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Prefixo</label>
                  <input className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.codigoPrefix} onChange={e => setFormData({...formData, codigoPrefix: e.target.value})} placeholder="Ex: VT" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Sufixo</label>
                  <input className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.codigoSuffix} onChange={e => setFormData({...formData, codigoSuffix: e.target.value})} placeholder="Ex: 0048" />
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Descrição</label>
                <input className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tipo</label>
                <select className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})}>
                  <option value="">Selecione</option>
                  <option value="Bobina">Bobina</option>
                  <option value="Fardo">Fardo</option>
                  <option value="Caixa">Caixa</option>
                  <option value="Pallet">Pallet</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Estoque Inicial</label>
                <input type="number" className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.estoque} onChange={e => setFormData({...formData, estoque: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Valor Unitário</label>
                <input type="number" className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.valorUnit} onChange={e => setFormData({...formData, valorUnit: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Peso Unitário</label>
                <input type="number" className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.pesoUnit} onChange={e => setFormData({...formData, pesoUnit: e.target.value})} />
              </div>
            </div>
          ) : (activeTab === 'internas' || activeTab === 'entradas' || activeTab === 'saidas') ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Produto</label>
                <select className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.produtoId} onChange={e => setFormData({...formData, produtoId: e.target.value})}>
                  <option value="">Selecione</option>
                  {produtos.map(p => <option key={p.id} value={p.id}>{p.codigo} - {p.descricao}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tipo Movimentação</label>
                  <select className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.tipoMov} onChange={e => setFormData({...formData, tipoMov: e.target.value})}>
                    <option value="">Selecione</option>
                    <option value="entrada">Entrada (Compra)</option>
                    <option value="saida">Saída (Venda)</option>
                    <option value="devolucao">Devolução (Retorno ao Estoque)</option>
                    <option value="Produção">Produção</option>
                    <option value="Transferência">Transferência</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Quantidade</label>
                  <input type="number" className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.quantidade} onChange={e => setFormData({...formData, quantidade: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Peso Total (kg)</label>
                  <input type="number" className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.peso} onChange={e => setFormData({...formData, peso: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nota Fiscal</label>
                  <input className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.nf} onChange={e => setFormData({...formData, nf: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Responsável</label>
                <select className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.responsavel} onChange={e => setFormData({...formData, responsavel: e.target.value})}>
                  <option value="">Selecione</option>
                  {funcionarios.map(f => <option key={f.id} value={f.nome}>{f.nome}</option>)}
                </select>
              </div>
            </div>
          ) : activeTab === 'fornecedores' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nome</label>
                <input className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Telefone</label>
                <input className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Email</label>
                <input className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
            </div>
          ) : activeTab === 'funcionarios' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nome</label>
                <input className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Registro</label>
                  <input className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.registro} onChange={e => setFormData({...formData, registro: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nível</label>
                  <select className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.nivel} onChange={e => setFormData({...formData, nivel: e.target.value})}>
                    <option value="funcionario">Funcionário</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>
              {!editingItem && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Senha</label>
                  <input type="password" title="Senha" className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.senha} onChange={e => setFormData({...formData, senha: e.target.value})} />
                </div>
              )}
            </div>
          ) : null}
        </Modal>
      )}
    </div>
  );
}
