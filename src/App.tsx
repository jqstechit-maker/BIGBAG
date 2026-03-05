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
  List
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
const INITIAL_PRODUTOS = [];

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
];

const INITIAL_MOVIMENTACOES = [];

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
      <div className="p-6 space-y-4">
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
                    <button onClick={() => onDelete(item.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('admin'); // 'admin' or 'funcionario'
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [estoqueViewMode, setEstoqueViewMode] = useState('grid'); // 'grid' or 'list'
  
  const exportToExcel = (type) => {
    const data = movimentacoes
      .filter(m => m.tipo === type)
      .map(m => {
        const base = {
          Data: m.data,
          Código: m.codigo,
          Produto: m.produto,
          Fornecedor: m.fornecedor,
          Quantidade: m.qtd,
          Peso: m.peso,
          NF: m.nf,
          Responsável: m.responsavel
        };
        if (userRole === 'admin') {
          return {
            ...base,
            'Valor Unitário': Number(m.valorUnit).toFixed(3),
            'Valor Total': Number(m.valorTotal).toFixed(3)
          };
        }
        return base;
      });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, type === 'entrada' ? 'Entradas' : 'Saídas');
    XLSX.writeFile(workbook, `Relatorio_${type}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = (type) => {
    const doc = new jsPDF('l', 'mm', 'a4');
    const data = movimentacoes.filter(m => m.tipo === type);
    
    const headers = [
      'Data', 'Código', 'Produto', 'Fornecedor', 'Qtd', 'Peso', 'NF', 'Responsável',
      ...(userRole === 'admin' ? ['V. Unit', 'V. Total'] : [])
    ];

    const rows = data.map(m => [
      m.data, m.codigo, m.produto, m.fornecedor, m.qtd, Number(m.peso || 0).toFixed(3), m.nf, m.responsavel,
      ...(userRole === 'admin' ? [Number(m.valorUnit || 0).toFixed(3), Number(m.valorTotal || 0).toFixed(3)] : [])
    ]);
    
    doc.setFontSize(18);
    doc.text(`Relatório de ${type === 'entrada' ? 'Entradas' : 'Saídas'} - VIRTUDE BIGBAG'S`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 22);

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 25,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 8 }
    });

    doc.save(`Relatorio_${type}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // States for Data
  const [produtos, setProdutos] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [galpoes, setGalpoes] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [movimentacoesInternas, setMovimentacoesInternas] = useState([]);

  // Helper para fetch com credenciais e tratamento de erro global
  const apiFetch = async (url: string, options: RequestInit = {}) => {
    const defaultOptions: RequestInit = {
      credentials: 'include',
      ...options,
      headers: {
        ...(options.headers || {}),
      },
    };

    const response = await fetch(url, defaultOptions);
    
    if (response.status === 401) {
      if (isLoggedIn) {
        setIsLoggedIn(false);
        setCurrentUser(null);
        // alert('Sessão expirada. Por favor, faça login novamente.');
      }
      return response;
    }
    
    return response;
  };

  // Fetch Data on Load
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await apiFetch('/api/me');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setUserRole(data.user.nivel);
            setCurrentUser(data.user);
            setIsLoggedIn(true);
          }
        }
      } catch (e) {}
    };
    checkSession();

    if (isLoggedIn) {
      fetchData();
    }
  }, [isLoggedIn]);

  const fetchData = async () => {
    try {
      const [prodRes, fornRes, galpRes, funcRes, movRes, movIntRes] = await Promise.all([
        apiFetch('/api/produtos'),
        apiFetch('/api/fornecedores'),
        apiFetch('/api/galpoes'),
        apiFetch('/api/funcionarios'),
        apiFetch('/api/movimentacoes'),
        apiFetch('/api/movimentacoes_internas')
      ]);

      const p = await prodRes.json();
      const f = await fornRes.json();
      const g = await galpRes.json();
      const fu = await funcRes.json();
      const m = await movRes.json();
      const mi = await movIntRes.json();

      if (Array.isArray(p)) setProdutos(p);
      if (Array.isArray(f)) setFornecedores(f);
      if (Array.isArray(g)) setGalpoes(g);
      if (Array.isArray(fu)) setFuncionarios(fu);
      if (Array.isArray(m)) setMovimentacoes(m);
      if (Array.isArray(mi)) setMovimentacoesInternas(mi);
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
    }
  };

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

  const handleLogin = async (username, password) => {
    try {
      const res = await apiFetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.message || 'Erro ao fazer login. Verifique suas credenciais.');
        return;
      }

      const data = await res.json();
      if (data.success) {
        setUserRole(data.user.nivel);
        setCurrentUser(data.user);
        setIsLoggedIn(true);
      }
    } catch (err) {
      alert('Erro de conexão com o servidor. Verifique se o banco de dados local está rodando.');
    }
  };

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

  const FilterBar = ({ fields }) => (
    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-6 flex flex-wrap gap-4 items-end">
      {fields.includes('data') && (
        <div className="flex-1 min-w-[150px]">
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Data</label>
          <input type="date" className="w-full p-2 bg-slate-50 border rounded-lg text-xs" value={filters.data} onChange={e => handleFilterChange('data', e.target.value)} />
        </div>
      )}
      {fields.includes('codigo') && (
        <div className="flex-1 min-w-[150px]">
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Código</label>
          <input placeholder="Ex: VT-0048" className="w-full p-2 bg-slate-50 border rounded-lg text-xs" value={filters.codigo} onChange={e => handleFilterChange('codigo', e.target.value)} />
        </div>
      )}
      {fields.includes('descricao') && (
        <div className="flex-1 min-w-[150px]">
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Descrição</label>
          <input placeholder="Buscar..." className="w-full p-2 bg-slate-50 border rounded-lg text-xs" value={filters.descricao} onChange={e => handleFilterChange('descricao', e.target.value)} />
        </div>
      )}
      {fields.includes('tipo') && (
        <div className="flex-1 min-w-[150px]">
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tipo</label>
          <select className="w-full p-2 bg-slate-50 border rounded-lg text-xs" value={filters.tipo} onChange={e => handleFilterChange('tipo', e.target.value)}>
            <option value="">Todos</option>
            <option value="Bobina">Bobina</option>
            <option value="Fardo">Fardo</option>
            <option value="Caixa">Caixa</option>
            <option value="Pacote">Pacote</option>
            <option value="Rolo">Rolo</option>
          </select>
        </div>
      )}
      {fields.includes('fornecedor') && (
        <div className="flex-1 min-w-[150px]">
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Fornecedor</label>
          <select className="w-full p-2 bg-slate-50 border rounded-lg text-xs" value={filters.fornecedor} onChange={e => handleFilterChange('fornecedor', e.target.value)}>
            <option value="">Todos</option>
            {fornecedores.map(f => <option key={f.id} value={f.nome}>{f.nome}</option>)}
          </select>
        </div>
      )}
      {fields.includes('nf') && (
        <div className="flex-1 min-w-[150px]">
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">NF</label>
          <input placeholder="Nº Nota" className="w-full p-2 bg-slate-50 border rounded-lg text-xs" value={filters.nf} onChange={e => handleFilterChange('nf', e.target.value)} />
        </div>
      )}
      {fields.includes('responsavel') && (
        <div className="flex-1 min-w-[150px]">
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Responsável</label>
          <select className="w-full p-2 bg-slate-50 border rounded-lg text-xs" value={filters.responsavel} onChange={e => handleFilterChange('responsavel', e.target.value)}>
            <option value="">Todos</option>
            {funcionarios.map(f => <option key={f.id} value={f.nome}>{f.nome}</option>)}
          </select>
        </div>
      )}
      <button onClick={clearFilters} className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Limpar Filtros">
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  );

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({ codigoPrefix: '', codigoSuffix: '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    const timestamp = new Date().toLocaleString();
    const method = editingItem ? 'PUT' : 'POST';
    let tabForUrl = activeTab;
    if (activeTab === 'estoque') tabForUrl = 'produtos';
    
    let url = editingItem ? `/api/${tabForUrl}/${editingItem.id}` : `/api/${tabForUrl}`;
    
    // Special URL for movements
    if (activeTab === 'entradas' || activeTab === 'saidas') {
      url = editingItem ? `/api/movimentacoes/${editingItem.id}` : '/api/movimentacoes';
    }
    if (activeTab === 'internas') {
      url = editingItem ? `/api/movimentacoes_internas/${editingItem.id}` : '/api/movimentacoes_internas';
    }

    try {
      let response;
      if (activeTab === 'produtos' || activeTab === 'estoque') {
        if (!formData.descricao || !formData.tipo) {
          alert('Por favor, preencha a descrição e o tipo do produto.');
          return;
        }

        const finalCodigo = formData.codigoPrefix && formData.codigoSuffix 
          ? `${formData.codigoPrefix}-${formData.codigoSuffix}` 
          : formData.codigo;
        
        const productData = { 
          codigo: finalCodigo,
          descricao: formData.descricao,
          tipo: formData.tipo,
          fornecedorId: formData.fornecedorId ? Number(formData.fornecedorId) : null,
          galpaoId: formData.galpaoId ? Number(formData.galpaoId) : null,
          min: Number(formData.min) || 0,
          pesoUnit: parseFloat(formData.pesoUnit) || 0,
          valorUnit: parseFloat(formData.valorUnit) || 0
        };

        response = await apiFetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData)
        });
      } else if (activeTab === 'fornecedores' || activeTab === 'funcionarios' || activeTab === 'galpoes') {
        if (activeTab === 'fornecedores' && !formData.nome) {
          alert('Por favor, informe o nome do fornecedor.');
          return;
        }
        if (activeTab === 'funcionarios' && (!formData.nome || (!editingItem && !formData.senha))) {
          alert('Por favor, informe o nome e a senha do funcionário.');
          return;
        }
        if (activeTab === 'galpoes' && !formData.nome) {
          alert('Por favor, informe o nome do galpão.');
          return;
        }

        // Clean up formData for these types if needed, but for now just send
        const cleanData = { ...formData };
        if (activeTab === 'funcionarios') {
          delete cleanData.nivel; // We use nivel_acesso in backend or map it
          cleanData.nivel = formData.nivel; // Ensure it's there if needed
        }

        response = await apiFetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cleanData)
        });
      } else if (activeTab === 'entradas' || activeTab === 'saidas') {
        if (!formData.produtoId || !formData.quantidade) {
          alert('Por favor, selecione o produto e informe a quantidade.');
          return;
        }
        const prod = produtos.find(p => p.id === parseInt(formData.produtoId));
        if (!prod) {
          alert('Erro: Produto não selecionado ou não encontrado no sistema.');
          return;
        }

        const qtd = parseInt(formData.quantidade);
        const isEntrada = activeTab === 'entradas';
        
        if (!isEntrada && !editingItem && prod.estoque < qtd) {
          alert(`Estoque insuficiente! O saldo atual de ${prod.descricao} é ${prod.estoque}.`);
          return;
        }

        const valorUnit = isEntrada ? (parseFloat(formData.valorUnit) || 0) : (prod.valorUnit || 0);
        const valorTotal = valorUnit * qtd;

        const movementData = {
          data: editingItem ? editingItem.data : timestamp,
          codigo: prod.codigo,
          produto: prod.descricao,
          fornecedor: fornecedores.find(f => f.id === prod.fornecedorId)?.nome || 'N/A',
          tipo: isEntrada ? 'entrada' : 'saida',
          qtd: qtd,
          peso: parseFloat(formData.peso) || 0,
          nf: formData.nf || 'N/A',
          responsavel: formData.responsavel || currentUser?.nome || 'Administrador',
          valorUnit: valorUnit,
          valorTotal: valorTotal,
          produtoId: prod.id
        };

        response = await apiFetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(movementData)
        });
      } else if (activeTab === 'internas') {
        if (!formData.produtoId || !formData.quantidade || !formData.tipoInterno) {
          alert('Por favor, preencha todos os campos obrigatórios.');
          return;
        }
        const prod = produtos.find(p => p.id === parseInt(formData.produtoId));
        if (!prod) return;

        const qtd = parseInt(formData.quantidade);
        if (prod.estoque < qtd) {
          alert(`Estoque insuficiente! Saldo atual: ${prod.estoque}`);
          return;
        }

        const internalData = {
          data: timestamp,
          codigo: prod.codigo,
          produto: prod.descricao,
          tipo: formData.tipoInterno,
          qtd: qtd,
          peso: parseFloat(formData.peso) || 0,
          responsavel: formData.responsavel || currentUser?.nome || 'Admin',
          destino: formData.destino || (formData.tipoInterno === 'Produção' ? 'Linha de Produção' : 'Outro Galpão'),
          valorUnit: prod.valorUnit || 0,
          valorTotal: (prod.valorUnit || 0) * qtd,
          produtoId: prod.id
        };

        response = await apiFetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(internalData)
        });
      }
      
      if (response && !response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Erro ao salvar dados');
      }

      await fetchData();
      setShowModal(false);
    } catch (err) {
      alert(err.message || 'Erro ao salvar dados');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.')) return;
    
    let tabForUrl = activeTab;
    if (activeTab === 'estoque') tabForUrl = 'produtos';

    let url = `/api/${tabForUrl}/${id}`;
    if (activeTab === 'entradas' || activeTab === 'saidas') {
      url = `/api/movimentacoes/${id}`;
    }
    if (activeTab === 'internas') {
      url = `/api/movimentacoes_internas/${id}`;
    }

    try {
      const res = await apiFetch(url, { method: 'DELETE' });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || errorData.error || 'Erro ao excluir');
      }
      await fetchData();
    } catch (err) {
      alert(err.message || 'Erro ao excluir registro');
    }
  };

  if (!isLoggedIn) return <Login onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900 text-white flex flex-col p-6 fixed h-full z-20">
        <div className="flex items-center mb-10 px-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mr-3">
            <Warehouse className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg leading-tight">VIRTUDE BIGBAG'S</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Virtude v1.0</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-4">Menu Principal</p>
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <SidebarItem icon={Package} label="Produtos" active={activeTab === 'produtos'} onClick={() => setActiveTab('produtos')} />
          <SidebarItem icon={Truck} label="Fornecedores" active={activeTab === 'fornecedores'} onClick={() => setActiveTab('fornecedores')} />
          <SidebarItem icon={Users} label="Funcionários" active={activeTab === 'funcionarios'} onClick={() => setActiveTab('funcionarios')} />
          <SidebarItem icon={Warehouse} label="Galpões" active={activeTab === 'galpoes'} onClick={() => setActiveTab('galpoes')} />

          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-8 mb-4 px-4">Logística</p>
          <SidebarItem icon={ArrowDownCircle} label="Entradas" active={activeTab === 'entradas'} onClick={() => setActiveTab('entradas')} />
          <SidebarItem icon={ArrowUpCircle} label="Saídas" active={activeTab === 'saidas'} onClick={() => setActiveTab('saidas')} />
          <SidebarItem icon={TrendingUp} label="Mov. Internas" active={activeTab === 'internas'} onClick={() => setActiveTab('internas')} />
          <SidebarItem icon={ClipboardList} label="Estoque" active={activeTab === 'estoque'} onClick={() => setActiveTab('estoque')} 
            badge={produtos.filter(p => p.estoque < p.min).length || null} 
          />
          <SidebarItem icon={FileText} label="Relatórios" active={activeTab === 'relatorios'} onClick={() => setActiveTab('relatorios')} />
        </div>

        <div className="mt-auto pt-6 border-t border-slate-800 space-y-2">
          <div className="px-4 py-2 bg-slate-800/50 rounded-lg">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Perfil Atual</p>
            <select 
              className="w-full bg-transparent text-xs font-bold text-blue-400 outline-none"
              value={userRole}
              onChange={e => setUserRole(e.target.value)}
            >
              <option value="admin" className="bg-slate-900">Administrador</option>
              <option value="funcionario" className="bg-slate-900">Funcionário</option>
            </select>
          </div>
          <button 
            onClick={async () => {
              try {
                await apiFetch('/api/logout', { method: 'POST' });
                setIsLoggedIn(false);
                setCurrentUser(null);
              } catch (e) {
                setIsLoggedIn(false);
              }
            }} 
            className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" /> Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-72 p-10">
        <header className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 capitalize">
              {activeTab === 'internas' ? 'Movimentações Internas' : activeTab}
            </h1>
            <p className="text-slate-500 mt-1">Gestão industrial em tempo real.</p>
          </div>
          {activeTab !== 'dashboard' && (
            <button onClick={openAddModal} className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all">
              <Plus className="w-5 h-5 mr-2" />
              {activeTab === 'entradas' || activeTab === 'saidas' || activeTab === 'internas' ? 'Registrar' : 'Novo Registro'}
            </button>
          )}
        </header>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            
            {activeTab === 'dashboard' && <Dashboard produtos={produtos} movimentacoes={movimentacoes} movimentacoesInternas={movimentacoesInternas} />}

            {activeTab === 'produtos' && (
              <>
                <FilterBar fields={['codigo', 'descricao', 'tipo', 'fornecedor']} />
                <GenericTable 
                  headers={['Código', 'Descrição', 'Tipo', 'Estoque']}
                  data={produtos.filter(p => {
                    const matchCodigo = p.codigo.toLowerCase().includes(filters.codigo.toLowerCase());
                    const matchDesc = p.descricao.toLowerCase().includes(filters.descricao.toLowerCase());
                    const matchTipo = filters.tipo ? p.tipo === filters.tipo : true;
                    const matchForn = filters.fornecedor ? fornecedores.find(f => f.id === p.fornecedorId)?.nome === filters.fornecedor : true;
                    return matchCodigo && matchDesc && matchTipo && matchForn;
                  })}
                  onDelete={handleDelete}
                  onEdit={(item) => { 
                    if (item.codigo && item.codigo.includes('-')) {
                      const [prefix, suffix] = item.codigo.split('-');
                      setFormData({ ...item, codigoPrefix: prefix, codigoSuffix: suffix });
                    } else {
                      setFormData(item);
                    }
                    setEditingItem(item); 
                    setShowModal(true); 
                  }}
                  renderRow={(p) => (
                  <>
                    <td className="px-6 py-4 font-mono text-blue-600">{p.codigo}</td>
                    <td className="px-6 py-4 font-medium">{p.descricao}</td>
                    <td className="px-6 py-4 text-slate-500">{p.tipo}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${p.estoque < p.min ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {p.estoque}
                      </span>
                    </td>
                  </>
                )}
              />
              </>
            )}

            {activeTab === 'fornecedores' && (
              <GenericTable 
                headers={['Nome', 'Telefone', 'Email']}
                data={fornecedores}
                onDelete={handleDelete}
                onEdit={(item) => { setEditingItem(item); setFormData(item); setShowModal(true); }}
                renderRow={(f) => (
                  <>
                    <td className="px-6 py-4 font-bold">{f.nome}</td>
                    <td className="px-6 py-4">{f.telefone}</td>
                    <td className="px-6 py-4 text-blue-600">{f.email}</td>
                  </>
                )}
              />
            )}

            {activeTab === 'funcionarios' && (
              <GenericTable 
                headers={['Registro', 'Nome', 'Função', 'Nível']}
                data={funcionarios}
                onDelete={handleDelete}
                onEdit={(item) => { setEditingItem(item); setFormData(item); setShowModal(true); }}
                renderRow={(f) => (
                  <>
                    <td className="px-6 py-4 font-mono text-blue-600">{f.registro}</td>
                    <td className="px-6 py-4 font-bold">{f.nome}</td>
                    <td className="px-6 py-4">{f.funcao}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-slate-100 rounded text-xs font-bold uppercase">{f.nivel}</span>
                    </td>
                  </>
                )}
              />
            )}

            {activeTab === 'galpoes' && (
              <GenericTable 
                headers={['Nome', 'Descrição']}
                data={galpoes}
                onDelete={handleDelete}
                onEdit={(item) => { setEditingItem(item); setFormData(item); setShowModal(true); }}
                renderRow={(g) => (
                  <>
                    <td className="px-6 py-4 font-bold">{g.nome}</td>
                    <td className="px-6 py-4 text-slate-500">{g.descricao}</td>
                  </>
                )}
              />
            )}

            {(activeTab === 'entradas' || activeTab === 'saidas') && (
              <>
                <FilterBar fields={['data', 'codigo', 'nf', 'responsavel', 'fornecedor']} />
                <GenericTable 
                  headers={[
                    'Data', 'Código', 'Descrição', 'Fornecedor', 'Qtd', 'Peso', 'NF', 'Responsável',
                    ...(userRole === 'admin' ? ['V. Unit', 'V. Total'] : [])
                  ]}
                  data={movimentacoes.filter(m => {
                    const matchTipoMov = m.tipo === (activeTab === 'entradas' ? 'entrada' : 'saida');
                    const matchData = filters.data ? m.data.includes(filters.data.split('-').reverse().join('/')) : true;
                    const matchCodigo = m.codigo.toLowerCase().includes(filters.codigo.toLowerCase());
                    const matchNF = m.nf.toLowerCase().includes(filters.nf.toLowerCase());
                    const matchResp = filters.responsavel ? m.responsavel === filters.responsavel : true;
                    const matchForn = filters.fornecedor ? m.fornecedor === filters.fornecedor : true;
                    return matchTipoMov && matchData && matchCodigo && matchNF && matchResp && matchForn;
                  })}
                  onDelete={handleDelete} 
                  onEdit={(item) => { 
                    setEditingItem(item); 
                    setFormData({
                      ...item,
                      quantidade: item.qtd,
                      produtoId: item.produtoId?.toString() || ''
                    }); 
                    setShowModal(true); 
                  }}
                renderRow={(m) => (
                  <>
                    <td className="px-6 py-4 text-slate-500 text-xs">{m.data}</td>
                    <td className="px-6 py-4 font-mono text-blue-600 text-xs">{m.codigo}</td>
                    <td className="px-6 py-4 font-bold text-xs">{m.produto}</td>
                    <td className="px-6 py-4 text-xs">{m.fornecedor}</td>
                    <td className={`px-6 py-4 text-center font-bold text-xs ${m.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                      {m.tipo === 'entrada' ? '+' : '-'}{m.qtd}
                    </td>
                    <td className="px-6 py-4 text-xs">{Number(m.peso).toFixed(3)} kg</td>
                    <td className="px-6 py-4 text-xs">{m.nf}</td>
                    <td className="px-6 py-4 text-xs">{m.responsavel}</td>
                    {userRole === 'admin' && (
                      <>
                        <td className="px-6 py-4 text-xs font-mono">R$ {Number(m.valorUnit || 0).toFixed(3)}</td>
                        <td className="px-6 py-4 text-xs font-mono font-bold">R$ {Number(m.valorTotal || 0).toFixed(3)}</td>
                      </>
                    )}
                  </>
                )}
              />
              </>
            )}

            {activeTab === 'estoque' && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <FilterBar fields={['codigo', 'descricao', 'tipo']} />
                  <div className="flex bg-white border border-slate-100 p-1 rounded-xl shadow-sm ml-4">
                    <button 
                      onClick={() => setEstoqueViewMode('grid')}
                      className={`p-2 rounded-lg transition-all ${estoqueViewMode === 'grid' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                      title="Visualização em Blocos"
                    >
                      <LayoutGrid className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setEstoqueViewMode('list')}
                      className={`p-2 rounded-lg transition-all ${estoqueViewMode === 'list' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                      title="Visualização em Linhas"
                    >
                      <List className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {estoqueViewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {produtos.filter(p => {
                      const matchCodigo = p.codigo.toLowerCase().includes(filters.codigo.toLowerCase());
                      const matchDesc = p.descricao.toLowerCase().includes(filters.descricao.toLowerCase());
                      const matchTipo = filters.tipo ? p.tipo === filters.tipo : true;
                      return matchCodigo && matchDesc && matchTipo;
                    }).map(p => {
                      const productMovements = movimentacoes.filter(m => m.produtoId === p.id);
                      const totalEntrada = productMovements.filter(m => m.tipo === 'entrada').reduce((acc, m) => acc + m.qtd, 0);
                      const totalSaida = productMovements.filter(m => m.tipo === 'saida').reduce((acc, m) => acc + m.qtd, 0);
                      return { ...p, totalEntrada, totalSaida };
                    }).map(p => (
                    <div key={p.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative group">
                      <div className="absolute top-4 right-4 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { 
                          if (p.codigo && p.codigo.includes('-')) {
                            const [prefix, suffix] = p.codigo.split('-');
                            setFormData({ ...p, codigoPrefix: prefix, codigoSuffix: suffix });
                          } else {
                            setFormData(p);
                          }
                          setEditingItem(p); 
                          setShowModal(true); 
                        }} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => {
                          handleDelete(p.id);
                        }} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.codigo}</p>
                          <h4 className="font-bold text-slate-800">{p.descricao}</h4>
                        </div>
                        <div className={`p-2 rounded-lg ${p.estoque < p.min ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                          <Package className="w-5 h-5" />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                          <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider">Entradas</p>
                          <p className="text-xl font-black text-green-700">{p.totalEntrada}</p>
                        </div>
                        <div className="bg-red-50 p-3 rounded-xl border border-red-100">
                          <p className="text-[10px] text-red-600 font-bold uppercase tracking-wider">Saídas</p>
                          <p className="text-xl font-black text-red-700">{p.totalSaida}</p>
                        </div>
                      </div>

                      <div className="flex items-end justify-between border-t border-slate-50 pt-4">
                        <div>
                          <p className="text-xs text-slate-500">Saldo Atual</p>
                          <p className="text-3xl font-black text-slate-900">{p.estoque}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${p.estoque < p.min ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {p.estoque < p.min ? 'Abaixo do Mínimo' : 'Estoque OK'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                ) : (
                  <GenericTable 
                    headers={['Código', 'Descrição', 'Tipo', 'Entradas', 'Saídas', 'Saldo Atual', 'Status']}
                    data={produtos.filter(p => {
                      const matchCodigo = p.codigo.toLowerCase().includes(filters.codigo.toLowerCase());
                      const matchDesc = p.descricao.toLowerCase().includes(filters.descricao.toLowerCase());
                      const matchTipo = filters.tipo ? p.tipo === filters.tipo : true;
                      return matchCodigo && matchDesc && matchTipo;
                    }).map(p => {
                      const productMovements = movimentacoes.filter(m => m.produtoId === p.id);
                      const totalEntrada = productMovements.filter(m => m.tipo === 'entrada').reduce((acc, m) => acc + m.qtd, 0);
                      const totalSaida = productMovements.filter(m => m.tipo === 'saida').reduce((acc, m) => acc + m.qtd, 0);
                      return { ...p, totalEntrada, totalSaida };
                    })}
                    onDelete={(id) => {
                      handleDelete(id);
                    }}
                    onEdit={(item) => {
                      if (item.codigo && item.codigo.includes('-')) {
                        const [prefix, suffix] = item.codigo.split('-');
                        setFormData({ ...item, codigoPrefix: prefix, codigoSuffix: suffix });
                      } else {
                        setFormData(item);
                      }
                      setEditingItem(item); 
                      setShowModal(true);
                    }}
                    renderRow={(p) => (
                      <>
                        <td className="px-6 py-4 font-mono text-blue-600 text-xs">{p.codigo}</td>
                        <td className="px-6 py-4 font-bold text-xs">{p.descricao}</td>
                        <td className="px-6 py-4 text-xs text-slate-500">{p.tipo}</td>
                        <td className="px-6 py-4 text-center font-bold text-green-600">{p.totalEntrada}</td>
                        <td className="px-6 py-4 text-center font-bold text-red-600">{p.totalSaida}</td>
                        <td className={`px-6 py-4 text-center font-black text-lg ${p.estoque < p.min ? 'text-red-600' : 'text-slate-900'}`}>
                          {p.estoque}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${p.estoque < p.min ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {p.estoque < p.min ? 'Abaixo do Mínimo' : 'Estoque OK'}
                          </span>
                        </td>
                      </>
                    )}
                  />
                )}
              </>
            )}

            {activeTab === 'internas' && (
              <>
                <FilterBar fields={['data', 'codigo', 'responsavel']} />
                <GenericTable 
                  headers={['Data', 'Código', 'Produto', 'Tipo', 'Qtd', 'Peso', 'Valor Unit.', 'Valor Total', 'Responsável', 'Destino']}
                  data={movimentacoesInternas.filter(m => {
                    const matchData = filters.data ? m.data.includes(filters.data.split('-').reverse().join('/')) : true;
                    const matchCodigo = m.codigo.toLowerCase().includes(filters.codigo.toLowerCase());
                    const matchResp = filters.responsavel ? m.responsavel === filters.responsavel : true;
                    return matchData && matchCodigo && matchResp;
                  })}
                  onDelete={handleDelete}
                  onEdit={(item) => { setEditingItem(item); setFormData({ ...item, tipoInterno: item.tipo, quantidade: item.qtd }); setShowModal(true); }}
                  renderRow={(m) => (
                    <>
                      <td className="px-6 py-4 text-slate-500 text-xs">{m.data}</td>
                      <td className="px-6 py-4 font-mono text-blue-600 text-xs">{m.codigo}</td>
                      <td className="px-6 py-4 font-bold text-xs">{m.produto}</td>
                      <td className="px-6 py-4 text-xs">
                        <span className={`px-2 py-1 rounded-lg font-bold ${m.tipo === 'Produção' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}`}>
                          {m.tipo}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-xs text-red-600">-{m.qtd}</td>
                      <td className="px-6 py-4 text-xs">{Number(m.peso).toFixed(3)} kg</td>
                      <td className="px-6 py-4 text-xs">R$ {Number(m.valorUnit || 0).toFixed(3)}</td>
                      <td className="px-6 py-4 text-xs font-bold">R$ {Number(m.valorTotal || 0).toFixed(3)}</td>
                      <td className="px-6 py-4 text-xs">{m.responsavel}</td>
                      <td className="px-6 py-4 text-xs font-medium">{m.destino}</td>
                    </>
                  )}
                />
              </>
            )}

            {activeTab === 'relatorios' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                  <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-6">
                    <ArrowDownCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Relatório de Entradas</h3>
                  <p className="text-slate-500 mb-8 text-sm">Exporte todas as entradas de materiais com detalhes de fornecedor, NF e valores.</p>
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => exportToExcel('entrada')}
                      className="flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-600/20"
                    >
                      <Download className="w-4 h-4 mr-2" /> Exportar Excel (.xlsx)
                    </button>
                    <button 
                      onClick={() => exportToPDF('entrada')}
                      className="flex items-center justify-center px-6 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all shadow-lg shadow-slate-800/20"
                    >
                      <FileText className="w-4 h-4 mr-2" /> Exportar PDF (.pdf)
                    </button>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                  <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
                    <ArrowUpCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Relatório de Saídas</h3>
                  <p className="text-slate-500 mb-8 text-sm">Exporte todas as saídas de materiais para controle de consumo e expedição.</p>
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => exportToExcel('saida')}
                      className="flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-600/20"
                    >
                      <Download className="w-4 h-4 mr-2" /> Exportar Excel (.xlsx)
                    </button>
                    <button 
                      onClick={() => exportToPDF('saida')}
                      className="flex items-center justify-center px-6 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all shadow-lg shadow-slate-800/20"
                    >
                      <FileText className="w-4 h-4 mr-2" /> Exportar PDF (.pdf)
                    </button>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm md:col-span-2">
                  <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-6">
                    <ClipboardList className="w-8 h-8 text-amber-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Balanço de Estoque</h3>
                  <p className="text-slate-500 mb-8 text-sm">Verifique a consistência entre as movimentações registradas e o saldo atual em estoque.</p>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="py-4 px-2 text-[10px] font-bold text-slate-400 uppercase">Produto</th>
                          <th className="py-4 px-2 text-[10px] font-bold text-slate-400 uppercase text-center">Entradas</th>
                          <th className="py-4 px-2 text-[10px] font-bold text-slate-400 uppercase text-center">Saídas Totais</th>
                          <th className="py-4 px-2 text-[10px] font-bold text-slate-400 uppercase text-center">Saldo Teórico</th>
                          <th className="py-4 px-2 text-[10px] font-bold text-slate-400 uppercase text-center">Saldo Atual</th>
                          <th className="py-4 px-2 text-[10px] font-bold text-slate-400 uppercase text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {produtos.map(p => {
                          const productMovs = movimentacoes.filter(m => m.produtoId === p.id);
                          const productMovsInt = movimentacoesInternas.filter(m => m.produtoId === p.id);
                          
                          const totalEntrada = productMovs.filter(m => m.tipo === 'entrada').reduce((acc, m) => acc + (Number(m.qtd) || 0), 0);
                          const totalSaida = productMovs.filter(m => m.tipo === 'saida').reduce((acc, m) => acc + (Number(m.qtd) || 0), 0) + productMovsInt.reduce((acc, m) => acc + (Number(m.qtd) || 0), 0);
                          
                          const theoretical = totalEntrada - totalSaida;
                          const diff = theoretical - p.estoque;
                          
                          return (
                            <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                              <td className="py-4 px-2">
                                <p className="text-xs font-bold text-slate-800">{p.descricao}</p>
                                <p className="text-[10px] font-mono text-blue-600">{p.codigo}</p>
                              </td>
                              <td className="py-4 px-2 text-center text-xs font-bold text-green-600">{totalEntrada}</td>
                              <td className="py-4 px-2 text-center text-xs font-bold text-red-600">{totalSaida}</td>
                              <td className="py-4 px-2 text-center text-xs font-bold text-slate-700">{theoretical}</td>
                              <td className="py-4 px-2 text-center text-xs font-black text-slate-900">{p.estoque}</td>
                              <td className="py-4 px-2 text-center">
                                {diff === 0 ? (
                                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-[10px] font-bold uppercase">Consistente</span>
                                ) : (
                                  <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-[10px] font-bold uppercase">Divergente ({diff})</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Modals */}
        {showModal && (
          <Modal 
            title={editingItem ? `Editar ${activeTab.slice(0,-1)}` : `Novo Registro em ${activeTab}`}
            onClose={() => setShowModal(false)}
            onSave={handleSave}
          >
            {activeTab === 'produtos' && (
              <>
                <div className="flex gap-2">
                  <select 
                    className="w-1/3 p-3 bg-slate-50 border rounded-xl font-bold text-blue-600"
                    value={formData.codigoPrefix || ''}
                    onChange={e => setFormData({...formData, codigoPrefix: e.target.value})}
                  >
                    <option value="">Prefixo</option>
                    <option value="VT">VT (Tecido)</option>
                    <option value="VF">VF (Fios, Linhas e Cardaços)</option>
                    <option value="VL">VL (Liner)</option>
                    <option value="VA">VA (Alças)</option>
                    <option value="VD">VD (Diversos)</option>
                  </select>
                  <input 
                    placeholder="Número (ex: 0048)" 
                    className="flex-1 p-3 bg-slate-50 border rounded-xl" 
                    value={formData.codigoSuffix || ''} 
                    onChange={e => setFormData({...formData, codigoSuffix: e.target.value})} 
                  />
                </div>
                <input placeholder="Descrição" className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.descricao || ''} onChange={e => setFormData({...formData, descricao: e.target.value})} />
                <select className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.tipo || ''} onChange={e => setFormData({...formData, tipo: e.target.value})}>
                  <option value="">Tipo de Material</option>
                  <option value="Bobina">Bobina</option>
                  <option value="Fardo">Fardo</option>
                  <option value="Caixa">Caixa</option>
                  <option value="Pacote">Pacote</option>
                  <option value="Rolo">Rolo</option>
                </select>
                <div className="grid grid-cols-2 gap-4">
                  <select className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.fornecedorId || ''} onChange={e => setFormData({...formData, fornecedorId: e.target.value})}>
                    <option value="">Selecionar Fornecedor</option>
                    {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                  </select>
                  <select className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.galpaoId || ''} onChange={e => setFormData({...formData, galpaoId: e.target.value})}>
                    <option value="">Selecionar Galpão</option>
                    {galpoes.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
                  </select>
                </div>
                <input type="number" placeholder="Estoque Mínimo" className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.min || ''} onChange={e => setFormData({...formData, min: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" step="0.001" placeholder="Peso Unitário (kg)" className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.pesoUnit || ''} onChange={e => setFormData({...formData, pesoUnit: e.target.value})} />
                  <input type="number" step="0.001" placeholder="Valor Unitário (R$)" className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.valorUnit || ''} onChange={e => setFormData({...formData, valorUnit: e.target.value})} />
                </div>
              </>
            )}
            {activeTab === 'fornecedores' && (
              <>
                <input placeholder="Nome da Empresa" className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.nome || ''} onChange={e => setFormData({...formData, nome: e.target.value})} />
                <input placeholder="Telefone" className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.telefone || ''} onChange={e => setFormData({...formData, telefone: e.target.value})} />
                <input placeholder="Email" className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
              </>
            )}
            {activeTab === 'funcionarios' && (
              <>
                <input placeholder="Nome Completo (Login)" className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.nome || ''} onChange={e => setFormData({...formData, nome: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <input type="password" placeholder={editingItem ? "Nova Senha (opcional)" : "Senha de Acesso"} className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.senha || ''} onChange={e => setFormData({...formData, senha: e.target.value})} />
                  <input placeholder="Nº Registro" className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.registro || ''} onChange={e => setFormData({...formData, registro: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input placeholder="Função" className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.funcao || ''} onChange={e => setFormData({...formData, funcao: e.target.value})} />
                  <select className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.nivel || ''} onChange={e => setFormData({...formData, nivel: e.target.value})}>
                    <option value="">Nível de Acesso</option>
                    <option value="admin">Administrador</option>
                    <option value="funcionario">Funcionário</option>
                  </select>
                </div>
              </>
            )}
            {activeTab === 'galpoes' && (
              <>
                <input placeholder="Nome do Galpão" className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.nome || ''} onChange={e => setFormData({...formData, nome: e.target.value})} />
                <textarea placeholder="Descrição / Localização" className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.descricao || ''} onChange={e => setFormData({...formData, descricao: e.target.value})} />
              </>
            )}
            {(activeTab === 'entradas' || activeTab === 'saidas') && (
              <>
                <div className="bg-blue-50 p-4 rounded-xl mb-4 border border-blue-100">
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Informação Automática</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase">Código</p>
                      <p className="text-sm font-bold text-slate-700">{produtos.find(p => p.id === parseInt(formData.produtoId))?.codigo || '---'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase">Fornecedor</p>
                      <p className="text-sm font-bold text-slate-700">{fornecedores.find(f => f.id === produtos.find(p => p.id === parseInt(formData.produtoId))?.fornecedorId)?.nome || '---'}</p>
                    </div>
                  </div>
                </div>

                <select className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.produtoId || ''} onChange={e => setFormData({...formData, produtoId: e.target.value})}>
                  <option value="">Selecione o Produto</option>
                  {produtos.map(p => <option key={p.id} value={p.id}>{p.descricao} (Saldo: {p.estoque})</option>)}
                </select>
                
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="Quantidade" className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.quantidade || ''} onChange={e => setFormData({...formData, quantidade: e.target.value})} />
                  <input type="number" step="0.001" placeholder="Peso Total (kg)" className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.peso || ''} onChange={e => setFormData({...formData, peso: e.target.value})} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <input placeholder="Nota Fiscal" className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.nf || ''} onChange={e => setFormData({...formData, nf: e.target.value})} />
                  <select className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.responsavel || ''} onChange={e => setFormData({...formData, responsavel: e.target.value})}>
                    <option value="">Selecione o Responsável</option>
                    {funcionarios.map(f => <option key={f.id} value={f.nome}>{f.nome}</option>)}
                  </select>
                </div>

                {userRole === 'admin' && activeTab === 'entradas' && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Dados Financeiros (Apenas Admin)</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-slate-400 text-sm">R$</span>
                        <input 
                          type="number" 
                          step="0.01" 
                          placeholder="Valor Unitário" 
                          className="w-full p-3 pl-10 bg-white border rounded-xl" 
                          value={formData.valorUnit || ''} 
                          onChange={e => setFormData({...formData, valorUnit: e.target.value})} 
                        />
                      </div>
                      <div className="flex items-center px-4 bg-white border rounded-xl">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase">Valor Total Estimado</p>
                          <p className="font-bold text-slate-700">R$ {( (parseFloat(formData.valorUnit) || 0) * (parseInt(formData.quantidade) || 0) ).toFixed(3)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            {activeTab === 'internas' && (
              <>
                <select className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.produtoId || ''} onChange={e => setFormData({...formData, produtoId: e.target.value})}>
                  <option value="">Selecione o Produto</option>
                  {produtos.map(p => <option key={p.id} value={p.id}>{p.descricao} (Saldo: {p.estoque})</option>)}
                </select>
                <div className="grid grid-cols-2 gap-4">
                  <select className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.tipoInterno || ''} onChange={e => setFormData({...formData, tipoInterno: e.target.value})}>
                    <option value="">Tipo de Movimentação</option>
                    <option value="Produção">Para Produção</option>
                    <option value="Transferência">Para Outro Galpão</option>
                  </select>
                  <input type="number" placeholder="Quantidade" className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.quantidade || ''} onChange={e => setFormData({...formData, quantidade: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" step="0.001" placeholder="Peso Total (kg)" className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.peso || ''} onChange={e => setFormData({...formData, peso: e.target.value})} />
                  <select className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.responsavel || ''} onChange={e => setFormData({...formData, responsavel: e.target.value})}>
                    <option value="">Selecione o Responsável</option>
                    {funcionarios.map(f => <option key={f.id} value={f.nome}>{f.nome}</option>)}
                  </select>
                </div>
                <input placeholder={formData.tipoInterno === 'Transferência' ? "Galpão de Destino" : "Destino / Observação"} className="w-full p-3 bg-slate-50 border rounded-xl" value={formData.destino || ''} onChange={e => setFormData({...formData, destino: e.target.value})} />
              </>
            )}
          </Modal>
        )}
      </main>
    </div>
  );
}

// Re-using Login component from previous turn...
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
          <p className="text-slate-400">Controle de Estoque & Logística</p>
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
          <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all transform active:scale-[0.98]">Acessar Sistema</button>
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

const Dashboard = ({ produtos = [], movimentacoes = [], movimentacoesInternas = [] }) => {
  const safeProdutos = Array.isArray(produtos) ? produtos : [];
  const safeMovimentacoes = Array.isArray(movimentacoes) ? movimentacoes : [];
  const safeMovimentacoesInternas = Array.isArray(movimentacoesInternas) ? movimentacoesInternas : [];

  const totalEstoqueQtd = safeProdutos.reduce((acc, p) => acc + (Number(p.estoque) || 0), 0);
  const totalEstoqueValor = safeProdutos.reduce((acc, p) => acc + ((Number(p.estoque) || 0) * (Number(p.valorUnit) || 0)), 0);
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const filterByMonth = (m) => {
    if (!m || !m.data) return false;
    try {
      const datePart = m.data.split(',')[0].trim();
      const [dia, mes, ano] = datePart.includes('/') ? datePart.split('/') : datePart.split('-');
      const mMonth = datePart.includes('/') ? parseInt(mes) - 1 : parseInt(mes) - 1;
      const mYear = datePart.includes('/') ? parseInt(ano) : parseInt(dia);
      return mMonth === currentMonth && mYear === currentYear;
    } catch (e) { return false; }
  };

  const movimentosMes = safeMovimentacoes.filter(filterByMonth);
  const movimentosInternosMes = safeMovimentacoesInternas.filter(filterByMonth);

  const entradasMesQtd = movimentosMes.filter(m => m.tipo === 'entrada').reduce((acc, m) => acc + (Number(m.qtd) || 0), 0);
  const entradasMesVal = movimentosMes.filter(m => m.tipo === 'entrada').reduce((acc, m) => acc + (Number(m.valorTotal) || 0), 0);
  
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
      if (!m || !m.data) return false;
      try {
        const datePart = m.data.split(',')[0].trim();
        const [dia, mes, ano] = datePart.includes('/') ? datePart.split('/') : datePart.split('-');
        const mMonth = datePart.includes('/') ? parseInt(mes) - 1 : parseInt(mes) - 1;
        const mYear = datePart.includes('/') ? parseInt(ano) : parseInt(dia);
        return mMonth === mIndex && mYear === yIndex;
      } catch (e) { return false; }
    };

    const monthMovs = safeMovimentacoes.filter(filterBySpecificMonth);
    const monthMovsInt = safeMovimentacoesInternas.filter(filterBySpecificMonth);

    return {
      name: monthName,
      entradasQtd: monthMovs.filter(m => m.tipo === 'entrada').reduce((acc, m) => acc + (Number(m.qtd) || 0), 0),
      saidasQtd: monthMovs.filter(m => m.tipo === 'saida').reduce((acc, m) => acc + (Number(m.qtd) || 0), 0) + monthMovsInt.reduce((acc, m) => acc + (Number(m.qtd) || 0), 0),
      entradasVal: monthMovs.filter(m => m.tipo === 'entrada').reduce((acc, m) => acc + (Number(m.valorTotal) || 0), 0),
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

const COLORS = ['#3b82f6', '#22c55e', '#eab308', '#a855f7', '#6b7280'];
