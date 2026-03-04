import express from 'express';
import { createServer as createViteServer } from 'vite';
import mysql from 'mysql2/promise';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import session from 'express-session';

dotenv.config();

// Verificação de variáveis de ambiente obrigatórias para MySQL (XAMPP)
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_NAME'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('ERRO CRÍTICO: Variáveis de ambiente ausentes:', missingEnvVars.join(', '));
  process.exit(1);
}

// Extend session type for TypeScript
declare module 'express-session' {
  interface SessionData {
    user_id: number;
    nivel_acesso: 'super_admin' | 'admin' | 'funcionario';
  }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let pool: any;
let isMockMode = false;

// Mock Data Store
const mockData: any = {
  usuario: [
    { id: 1, nome: 'admin', email: 'admin@admin', senha: 'admin', registro: '000', funcao: 'Admin', nivel_acesso: 'admin' },
    { id: 2, nome: 'João Silva', email: 'joao@virtude.com', senha: '123', registro: '001', funcao: 'Auxiliar de Produção', nivel_acesso: 'funcionario' },
    { id: 3, nome: 'Maria Santos', email: 'maria@virtude.com', senha: '123', registro: '002', funcao: 'Gerente de Logística', nivel_acesso: 'admin' },
    { id: 4, nome: 'Pedro Oliveira', email: 'pedro@virtude.com', senha: '123', registro: '003', funcao: 'Operador de Empilhadeira', nivel_acesso: 'funcionario' },
    { id: 5, nome: 'Ana Costa', email: 'ana@virtude.com', senha: '123', registro: '004', funcao: 'Conferente', nivel_acesso: 'funcionario' }
  ],
  fornecedores: [
    { id: 1, nome: 'Fornecedor Alfa', telefone: '(11) 1111-1111', email: 'alfa@forn.com' },
    { id: 2, nome: 'Fornecedor Beta', telefone: '(22) 2222-2222', email: 'beta@forn.com' },
    { id: 3, nome: 'Fornecedor Gama', telefone: '(33) 3333-3333', email: 'gama@forn.com' },
    { id: 4, nome: 'Fornecedor Delta', telefone: '(44) 4444-4444', email: 'delta@forn.com' },
    { id: 5, nome: 'Fornecedor Epsilon', telefone: '(55) 5555-5555', email: 'epsilon@forn.com' }
  ],
  galpoes: [
    { id: 1, nome: 'Galpão Norte', descricao: 'Armazenamento Principal' },
    { id: 2, nome: 'Galpão Sul', descricao: 'Armazenamento Secundário' }
  ],
  produtos: [
    { id: 1, codigo: 'VT-001', descricao: 'Tecido', tipo: 'Fardo', fornecedorId: 1, galpaoId: 1, estoque: 50, min: 10, pesoUnit: 2.0, valorUnit: 50.0 },
    { id: 2, codigo: 'VL-001', descricao: 'Linner', tipo: 'Fardo', fornecedorId: 2, galpaoId: 1, estoque: 50, min: 10, pesoUnit: 2.0, valorUnit: 60.0 },
    { id: 3, codigo: 'VA-001', descricao: 'Alça', tipo: 'Fardo', fornecedorId: 3, galpaoId: 2, estoque: 50, min: 10, pesoUnit: 2.0, valorUnit: 70.0 },
    { id: 4, codigo: 'VF-001', descricao: 'Linhas e Cardaços', tipo: 'Fardo', fornecedorId: 4, galpaoId: 2, estoque: 100, min: 10, pesoUnit: 2.0, valorUnit: 80.0 },
    { id: 5, codigo: 'VT-002', descricao: 'Linner Reforçado', tipo: 'Fardo', fornecedorId: 5, galpaoId: 1, estoque: 100, min: 10, pesoUnit: 2.0, valorUnit: 90.0 }
  ],
  movimentacoes: [
    { id: 1, data: '01/03/2026 10:00:00', codigo: 'VT-001', produto: 'Tecido', fornecedor: 'Fornecedor Alfa', tipo: 'entrada', qtd: 100, peso: 200.0, nf: 'NF-101', responsavel: 'admin', valorUnit: 50.0, valorTotal: 5000.0, produtoId: 1 },
    { id: 2, data: '01/03/2026 10:05:00', codigo: 'VL-001', produto: 'Linner', fornecedor: 'Fornecedor Beta', tipo: 'entrada', qtd: 100, peso: 200.0, nf: 'NF-102', responsavel: 'admin', valorUnit: 60.0, valorTotal: 6000.0, produtoId: 2 },
    { id: 3, data: '01/03/2026 10:10:00', codigo: 'VA-001', produto: 'Alça', fornecedor: 'Fornecedor Gama', tipo: 'entrada', qtd: 100, peso: 200.0, nf: 'NF-103', responsavel: 'admin', valorUnit: 70.0, valorTotal: 7000.0, produtoId: 3 },
    { id: 4, data: '01/03/2026 10:15:00', codigo: 'VF-001', produto: 'Linhas e Cardaços', fornecedor: 'Fornecedor Delta', tipo: 'entrada', qtd: 100, peso: 200.0, nf: 'NF-104', responsavel: 'admin', valorUnit: 80.0, valorTotal: 8000.0, produtoId: 4 },
    { id: 5, data: '01/03/2026 10:20:00', codigo: 'VT-002', produto: 'Linner Reforçado', fornecedor: 'Fornecedor Epsilon', tipo: 'entrada', qtd: 100, peso: 200.0, nf: 'NF-105', responsavel: 'admin', valorUnit: 90.0, valorTotal: 9000.0, produtoId: 5 },
    { id: 6, data: '01/03/2026 14:00:00', codigo: 'VT-001', produto: 'Tecido', fornecedor: 'Fornecedor Alfa', tipo: 'saida', qtd: 50, peso: 100.0, nf: 'NF-S01', responsavel: 'João Silva', valorUnit: 50.0, valorTotal: 2500.0, produtoId: 1 },
    { id: 7, data: '01/03/2026 14:05:00', codigo: 'VL-001', produto: 'Linner', fornecedor: 'Fornecedor Beta', tipo: 'saida', qtd: 50, peso: 100.0, nf: 'NF-S02', responsavel: 'João Silva', valorUnit: 60.0, valorTotal: 3000.0, produtoId: 2 },
    { id: 8, data: '01/03/2026 14:10:00', codigo: 'VA-001', produto: 'Alça', fornecedor: 'Fornecedor Gama', tipo: 'saida', qtd: 50, peso: 100.0, nf: 'NF-S03', responsavel: 'João Silva', valorUnit: 70.0, valorTotal: 3500.0, produtoId: 3 }
  ]
};

function createMockPool() {
  const queryHandler = async (sqlStr: string, params: any[] = []) => {
    const lowerSql = sqlStr.toLowerCase();
    
    // SELECT USUARIO
    if (lowerSql.includes('from usuario')) {
      if (lowerSql.includes('nome = ? and senha = ?')) {
        const user = mockData.usuario.find((u: any) => u.nome === params[0] && u.senha === params[1]);
        return user ? [user] : [];
      }
      if (lowerSql.includes('where nome = ?')) {
        const user = mockData.usuario.find((u: any) => u.nome === params[0]);
        return user ? [user] : [];
      }
      if (lowerSql.includes('where id = ?')) {
        const user = mockData.usuario.find((u: any) => u.id === Number(params[0]));
        return user ? [user] : [];
      }
      return mockData.usuario;
    }

    // SELECT OTHERS
    if (lowerSql.includes('from produtos')) {
      if (lowerSql.includes('where id = ?')) {
        const item = mockData.produtos.find((p: any) => p.id === Number(params[0]));
        return item ? [item] : [];
      }
      return mockData.produtos;
    }
    if (lowerSql.includes('from fornecedores')) {
      if (lowerSql.includes('where id = ?')) {
        const item = mockData.fornecedores.find((f: any) => f.id === Number(params[0]));
        return item ? [item] : [];
      }
      return mockData.fornecedores;
    }
    if (lowerSql.includes('from galpoes')) {
      if (lowerSql.includes('where id = ?')) {
        const item = mockData.galpoes.find((g: any) => g.id === Number(params[0]));
        return item ? [item] : [];
      }
      return mockData.galpoes;
    }
    if (lowerSql.includes('from movimentacoes')) {
      if (lowerSql.includes('where id = ?')) {
        const item = mockData.movimentacoes.find((m: any) => m.id === Number(params[0]));
        return item ? [item] : [];
      }
      const sorted = [...mockData.movimentacoes].sort((a, b) => b.id - a.id);
      return sorted;
    }

    if (lowerSql.includes('from movimentacoes_internas')) {
      if (!mockData.movimentacoes_internas) mockData.movimentacoes_internas = [];
      if (lowerSql.includes('where id = ?')) {
        const item = mockData.movimentacoes_internas.find((m: any) => m.id === Number(params[0]));
        return item ? [item] : [];
      }
      const sorted = [...mockData.movimentacoes_internas].sort((a, b) => b.id - a.id);
      return sorted.slice(0, 100);
    }

    // INSERT USUARIO
    if (lowerSql.includes('insert into usuario')) {
      const newUser = { 
        id: mockData.usuario.length + 1, 
        nome: params[0], 
        email: params[1],
        senha: params[2], 
        registro: params[3], 
        funcao: params[4], 
        nivel_acesso: params[5] 
      };
      mockData.usuario.push(newUser);
      return { insertId: newUser.id };
    }

    // INSERT PRODUTOS
    if (lowerSql.includes('insert into produtos')) {
      const newProd = { 
        id: mockData.produtos.length + 1, 
        codigo: params[0], 
        descricao: params[1], 
        tipo: params[2], 
        fornecedorId: Number(params[3]), 
        galpaoId: Number(params[4]), 
        estoque: 0, 
        min: Number(params[5]), 
        pesoUnit: Number(params[6]), 
        valorUnit: Number(params[7]) 
      };
      mockData.produtos.push(newProd);
      return { insertId: newProd.id };
    }

    // INSERT FORNECEDORES
    if (lowerSql.includes('insert into fornecedores')) {
      const newItem = { id: mockData.fornecedores.length + 1, nome: params[0], telefone: params[1], email: params[2] };
      mockData.fornecedores.push(newItem);
      return { insertId: newItem.id };
    }

    // INSERT GALPOES
    if (lowerSql.includes('insert into galpoes')) {
      const newItem = { id: mockData.galpoes.length + 1, nome: params[0], descricao: params[1] };
      mockData.galpoes.push(newItem);
      return { insertId: newItem.id };
    }

    // INSERT MOVIMENTACOES
    if (lowerSql.includes('insert into movimentacoes')) {
      const newItem = { 
        id: mockData.movimentacoes.length + 1, 
        data: params[0], codigo: params[1], produto: params[2], fornecedor: params[3], 
        tipo: params[4], qtd: Number(params[5]), peso: Number(params[6]), nf: params[7], 
        responsavel: params[8], valorUnit: Number(params[9]), valorTotal: Number(params[10]),
        produtoId: Number(params[11])
      };
      mockData.movimentacoes.push(newItem);
      return { insertId: newItem.id };
    }

    // INSERT MOVIMENTACOES INTERNAS
    if (lowerSql.includes('insert into movimentacoes_internas')) {
      if (!mockData.movimentacoes_internas) mockData.movimentacoes_internas = [];
      const newItem = { 
        id: mockData.movimentacoes_internas.length + 1, 
        data: params[0], codigo: params[1], produto: params[2], tipo: params[3],
        qtd: Number(params[4]), peso: Number(params[5]), responsavel: params[6], 
        destino: params[7], valorUnit: Number(params[8]), valorTotal: Number(params[9]),
        produtoId: Number(params[10])
      };
      mockData.movimentacoes_internas.push(newItem);
      return { insertId: newItem.id };
    }

    // UPDATE PRODUTOS ESTOQUE
    if (lowerSql.includes('update produtos set estoque = estoque + ? where id = ?')) {
      const adjust = Number(params[0]);
      const id = Number(params[1]);
      const prod = mockData.produtos.find((p: any) => p.id === id);
      if (prod) prod.estoque += adjust;
      return { affectedRows: 1 };
    }

    // UPDATE PRODUTOS FULL
    if (lowerSql.includes('update produtos set codigo = ?')) {
      const id = Number(params[8]);
      const index = mockData.produtos.findIndex((p: any) => p.id === id);
      if (index !== -1) {
        mockData.produtos[index] = { 
          ...mockData.produtos[index], 
          codigo: params[0], 
          descricao: params[1], 
          tipo: params[2], 
          fornecedorId: Number(params[3]), 
          galpaoId: Number(params[4]), 
          min: Number(params[5]), 
          pesoUnit: Number(params[6]), 
          valorUnit: Number(params[7]) 
        };
      }
      return { affectedRows: 1 };
    }

    // UPDATE USUARIO
    if (lowerSql.includes('update usuario set nome = ?')) {
      const id = Number(params[params.length - 1]);
      const index = mockData.usuario.findIndex((u: any) => u.id === id);
      if (index !== -1) {
        if (lowerSql.includes('senha = ?')) {
          mockData.usuario[index] = { ...mockData.usuario[index], nome: params[0], senha: params[1], registro: params[2], funcao: params[3], nivel_acesso: params[4] };
        } else {
          mockData.usuario[index] = { ...mockData.usuario[index], nome: params[0], registro: params[1], funcao: params[2], nivel_acesso: params[3] };
        }
      }
      return { affectedRows: 1 };
    }

    // UPDATE MOVIMENTACOES
    if (lowerSql.includes('update movimentacoes set qtd = ?')) {
      const id = Number(params[params.length - 1]);
      const index = mockData.movimentacoes.findIndex((m: any) => m.id === id);
      if (index !== -1) {
        mockData.movimentacoes[index] = { 
          ...mockData.movimentacoes[index], 
          qtd: Number(params[0]), 
          peso: Number(params[1]), 
          nf: params[2], 
          responsavel: params[3], 
          valorUnit: Number(params[4]), 
          valorTotal: Number(params[5]) 
        };
      }
      return { affectedRows: 1 };
    }

    // GENERIC UPDATE
    if (lowerSql.includes('update fornecedores')) {
      const id = Number(params[params.length - 1]);
      const index = mockData.fornecedores.findIndex((f: any) => f.id === id);
      if (index !== -1) mockData.fornecedores[index] = { ...mockData.fornecedores[index], nome: params[0], telefone: params[1], email: params[2] };
      return { affectedRows: 1 };
    }
    if (lowerSql.includes('update galpoes')) {
      const id = Number(params[params.length - 1]);
      const index = mockData.galpoes.findIndex((g: any) => g.id === id);
      if (index !== -1) mockData.galpoes[index] = { ...mockData.galpoes[index], nome: params[0], descricao: params[1] };
      return { affectedRows: 1 };
    }

    // DELETE
    if (lowerSql.includes('delete from')) {
      const id = Number(params[0]);
      if (lowerSql.includes('produtos')) mockData.produtos = mockData.produtos.filter((p: any) => p.id !== id);
      if (lowerSql.includes('fornecedores')) mockData.fornecedores = mockData.fornecedores.filter((f: any) => f.id !== id);
      if (lowerSql.includes('galpoes')) mockData.galpoes = mockData.galpoes.filter((g: any) => g.id !== id);
      if (lowerSql.includes('usuario')) mockData.usuario = mockData.usuario.filter((u: any) => u.id !== id);
      if (lowerSql.includes('movimentacoes')) mockData.movimentacoes = mockData.movimentacoes.filter((m: any) => m.id !== id);
      if (lowerSql.includes('movimentacoes_internas')) {
        if (!mockData.movimentacoes_internas) mockData.movimentacoes_internas = [];
        mockData.movimentacoes_internas = mockData.movimentacoes_internas.filter((m: any) => m.id !== id);
      }
      return { affectedRows: 1 };
    }

    return [];
  };

  return {
    query: queryHandler,
    getConnection: async () => ({
      beginTransaction: async () => {},
      commit: async () => {},
      rollback: async () => {},
      release: () => {},
      query: queryHandler
    })
  };
}

// MySQL Connection Config (XAMPP)
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'VirtudeEstoque',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function dbQuery(sqlStr: string, params: any[] = []) {
  if (isMockMode) {
    const result = await (pool as any).query(sqlStr, params);
    return [result];
  }
  const [rows] = await pool.query(sqlStr, params);
  return [rows];
}

async function initializeDatabase() {
  console.log('--- INICIANDO CONEXÃO COM O BANCO DE DADOS ---');
  
  try {
    // 1. Tentar conectar sem especificar o banco de dados primeiro
    const configSemBanco = { ...dbConfig, database: undefined };
    const tempPool = mysql.createPool(configSemBanco);
    
    console.log(`Tentando conectar ao MySQL em ${dbConfig.host}...`);
    await tempPool.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
    await tempPool.end();
    
    console.log(`Banco de dados "${dbConfig.database}" verificado/criado.`);

    // 2. Agora conectar ao banco de dados real
    pool = mysql.createPool(dbConfig);
    
    // Testar conexão
    const connection = await pool.getConnection();
    console.log('✅ Conexão com MySQL estabelecida com sucesso!');
    connection.release();
    
    try {
      console.log('Verificando tabelas...');
      
      // Fornecedores
      await dbQuery(`
        CREATE TABLE IF NOT EXISTS fornecedores (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nome VARCHAR(255) NOT NULL,
          telefone VARCHAR(255),
          email VARCHAR(255)
        )
      `);

      // Galpoes
      await dbQuery(`
        CREATE TABLE IF NOT EXISTS galpoes (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nome VARCHAR(255) NOT NULL,
          descricao TEXT
        )
      `);

      // Usuario
      await dbQuery(`
        CREATE TABLE IF NOT EXISTS usuario (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nome VARCHAR(255) UNIQUE NOT NULL,
          email VARCHAR(255),
          senha VARCHAR(255) NOT NULL,
          registro VARCHAR(255),
          funcao VARCHAR(255),
          nivel_acesso ENUM('super_admin', 'admin', 'funcionario') NOT NULL
        )
      `);

      // Produtos
      await dbQuery(`
        CREATE TABLE IF NOT EXISTS produtos (
          id INT AUTO_INCREMENT PRIMARY KEY,
          codigo VARCHAR(255) UNIQUE NOT NULL,
          descricao TEXT NOT NULL,
          tipo VARCHAR(255),
          fornecedorId INT,
          galpaoId INT,
          estoque INT DEFAULT 0,
          min INT DEFAULT 0,
          pesoUnit DECIMAL(10,3) DEFAULT 0,
          valorUnit DECIMAL(10,3) DEFAULT 0,
          FOREIGN KEY(fornecedorId) REFERENCES fornecedores(id),
          FOREIGN KEY(galpaoId) REFERENCES galpoes(id)
        )
      `);

      // Movimentacoes
      await dbQuery(`
        CREATE TABLE IF NOT EXISTS movimentacoes (
          id INT AUTO_INCREMENT PRIMARY KEY,
          data VARCHAR(255) NOT NULL,
          codigo VARCHAR(255) NOT NULL,
          produto TEXT NOT NULL,
          fornecedor VARCHAR(255),
          tipo ENUM('entrada', 'saida') NOT NULL,
          qtd INT NOT NULL,
          peso DECIMAL(10,3),
          nf VARCHAR(255),
          responsavel VARCHAR(255),
          valorUnit DECIMAL(10,3),
          valorTotal DECIMAL(10,3),
          produtoId INT,
          FOREIGN KEY(produtoId) REFERENCES produtos(id) ON DELETE SET NULL
        )
      `);

      // Movimentacoes Internas
      await dbQuery(`
        CREATE TABLE IF NOT EXISTS movimentacoes_internas (
          id INT AUTO_INCREMENT PRIMARY KEY,
          data VARCHAR(255) NOT NULL,
          codigo VARCHAR(255) NOT NULL,
          produto TEXT NOT NULL,
          tipo VARCHAR(100) NOT NULL,
          qtd INT NOT NULL,
          peso DECIMAL(10,3),
          responsavel VARCHAR(255),
          destino VARCHAR(255),
          valorUnit DECIMAL(10,3),
          valorTotal DECIMAL(10,3),
          produtoId INT,
          FOREIGN KEY(produtoId) REFERENCES produtos(id) ON DELETE SET NULL
        )
      `);

      console.log('Verificando usuário admin padrão...');
      const [rows]: any = await dbQuery('SELECT id FROM usuario WHERE nome = ?', ['admin']);
      if (rows.length === 0) {
        console.log('Criando dados iniciais (admin)...');
        
        await dbQuery('INSERT INTO usuario (nome, email, senha, registro, funcao, nivel_acesso) VALUES (?, ?, ?, ?, ?, ?)', 
          ['admin', 'admin@admin', 'admin', '000', 'Admin', 'admin']);
        
        await dbQuery('INSERT INTO galpoes (nome, descricao) VALUES (?, ?)', ['Galpão Norte', 'Armazenamento Principal']);
        await dbQuery('INSERT INTO galpoes (nome, descricao) VALUES (?, ?)', ['Galpão Sul', 'Armazenamento Secundário']);

        await dbQuery('INSERT INTO fornecedores (nome, telefone, email) VALUES (?, ?, ?)', ['Fornecedor Alfa', '(11) 1111-1111', 'alfa@forn.com']);
        
        console.log('Dados iniciais criados com sucesso.');
      }
      console.log('--- BANCO DE DADOS PRONTO ---');
    } catch (err) {
      console.error('Erro ao criar tabelas:', err.message);
      throw err;
    }
  } catch (err) {
    console.error('❌ ERRO DE CONEXÃO COM O BANCO DE DADOS:', err.message);
    console.log('---------------------------------------------------------');
    console.log('⚠️ ATENÇÃO: O sistema não conseguiu conectar ao seu MySQL.');
    console.log('⚠️ MOTIVO: ' + err.message);
    console.log('⚠️ Verifique se o MySQL do XAMPP está LIGADO.');
    console.log('⚠️ Verifique se o usuário/senha no arquivo .env estão corretos.');
    console.log('---------------------------------------------------------');
    console.log('🔄 Ativando MODO DE TESTE (Dados serão salvos apenas na memória).');
    isMockMode = true;
    pool = createMockPool();
    console.log('--- SISTEMA INICIADO EM MODO DE TESTE ---');
  }
}

async function startServer() {
  try {
    await initializeDatabase();
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('CRITICAL: Database initialization failed:', err.message);
  }

  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Necessário para que o cookie funcione atrás de proxies (como o do AI Studio)
  app.set('trust proxy', 1);

  app.use(cors({
    origin: true,
    credentials: true
  }));
  app.use(express.json());
  
  // Session configuration
  const isProduction = process.env.NODE_ENV === 'production';
  const isLocalhost = !process.env.APP_URL || process.env.APP_URL.includes('localhost');

  app.use(session({
    secret: process.env.SESSION_SECRET || 'virtude-secret-key-2026',
    resave: true,
    saveUninitialized: true,
    name: 'virtude_session',
    cookie: {
      // Se for localhost, secure deve ser false. Se for no preview, deve ser true.
      secure: !isLocalhost || isProduction, 
      httpOnly: true,
      // sameSite 'none' exige secure: true. Para localhost, usamos 'lax'.
      sameSite: (!isLocalhost || isProduction) ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
  }));

  // Authorization Middleware
  const checkAccess = (niveisPermitidos: string[]) => {
    return (req: any, res: any, next: any) => {
      if (!req.session || !req.session.user_id) {
        return res.status(401).json({ success: false, message: 'Sessão expirada. Por favor, faça login novamente.' });
      }
      
      const nivel = req.session.nivel_acesso;
      if (nivel === 'super_admin' || niveisPermitidos.includes(nivel)) {
        return next();
      }
      
      return res.status(403).json({ success: false, message: 'Acesso negado. Nível de permissão insuficiente.' });
    };
  };

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      database: isMockMode ? 'mock (in-memory)' : 'connected (mysql)',
      mode: process.env.NODE_ENV 
    });
  });

  // Auth
  app.get('/api/me', (req, res) => {
    if (req.session && req.session.user_id) {
      // Find user in pool or mock
      dbQuery('SELECT id, nome, email, nivel_acesso FROM usuario WHERE id = ?', [req.session.user_id])
        .then(([rows]: any) => {
          if (rows && rows.length > 0) {
            const user = rows[0];
            res.json({ 
              success: true, 
              user: { 
                id: user.id, 
                nome: user.nome, 
                email: user.email, 
                nivel: user.nivel_acesso 
              } 
            });
          } else {
            res.status(401).json({ success: false });
          }
        })
        .catch(() => res.status(500).json({ success: false }));
    } else {
      res.status(401).json({ success: false });
    }
  });

  app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const [rows] = await dbQuery('SELECT * FROM usuario WHERE nome = ? AND senha = ?', [username, password]) as any[];
    if (rows && rows.length > 0) {
      const user = rows[0];
      
      // Save to session
      req.session.user_id = user.id;
      req.session.nivel_acesso = user.nivel_acesso;
      
      res.json({ 
        success: true, 
        user: { 
          id: user.id, 
          nome: user.nome, 
          email: user.email, 
          nivel: user.nivel_acesso 
        } 
      });
    } else {
      res.status(401).json({ success: false, message: 'Credenciais inválidas' });
    }
  });

  app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ success: false });
      }
      res.clearCookie('virtude_session');
      res.json({ success: true });
    });
  });

  // Produtos
  app.get('/api/produtos', async (req, res) => {
    const [rows] = await dbQuery('SELECT id, codigo, descricao, tipo, fornecedorid as "fornecedorId", galpaoid as "galpaoId", estoque, min, pesounit as "pesoUnit", valorunit as "valorUnit" FROM produtos');
    res.json(rows);
  });

  app.post('/api/produtos', checkAccess(['admin']), async (req, res) => {
    const { codigo, descricao, tipo, fornecedorId, galpaoId, min, pesoUnit, valorUnit } = req.body;
    try {
      const [result] = await dbQuery(
        'INSERT INTO produtos (codigo, descricao, tipo, fornecedorid, galpaoid, min, pesounit, valorunit) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [codigo, descricao, tipo, fornecedorId, galpaoId, min, pesoUnit, valorUnit]
      ) as any[];
      res.json({ id: result.insertId });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  
  app.put('/api/produtos/:id', checkAccess(['admin']), async (req, res) => {
    const { id } = req.params;
    const { codigo, descricao, tipo, fornecedorId, galpaoId, min, pesoUnit, valorUnit } = req.body;
    await dbQuery(
      'UPDATE produtos SET codigo = ?, descricao = ?, tipo = ?, fornecedorid = ?, galpaoid = ?, min = ?, pesounit = ?, valorunit = ? WHERE id = ?',
      [codigo, descricao, tipo, fornecedorId, galpaoId, min, pesoUnit, valorUnit, id]
    );
    res.json({ success: true });
  });

  app.delete('/api/produtos/:id', checkAccess(['admin']), async (req, res) => {
    await dbQuery('DELETE FROM produtos WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  });

  // Movimentações
  app.get('/api/movimentacoes', async (req, res) => {
    const [rows] = await dbQuery('SELECT id, data, codigo, produto, fornecedor, tipo, qtd, peso, nf, responsavel, valorunit as "valorUnit", valortotal as "valorTotal", produtoid as "produtoId" FROM movimentacoes ORDER BY id DESC');
    res.json(rows);
  });

  app.post('/api/movimentacoes', async (req, res) => {
    const { data, codigo, produto, fornecedor, tipo, qtd, peso, nf, responsavel, valorUnit, valorTotal, produtoId } = req.body;
    
    if (isMockMode) {
      await dbQuery(
        'INSERT INTO movimentacoes (data, codigo, produto, fornecedor, tipo, qtd, peso, nf, responsavel, valorunit, valortotal, produtoid) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [data, codigo, produto, fornecedor, tipo, qtd, peso, nf, responsavel, valorUnit, valorTotal, produtoId]
      );
      const adjust = tipo === 'entrada' ? qtd : -qtd;
      await dbQuery('UPDATE produtos SET estoque = estoque + ? WHERE id = ?', [adjust, produtoId]);
      return res.json({ success: true });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query(
        'INSERT INTO movimentacoes (data, codigo, produto, fornecedor, tipo, qtd, peso, nf, responsavel, valorunit, valortotal, produtoid) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [data, codigo, produto, fornecedor, tipo, qtd, peso, nf, responsavel, valorUnit, valorTotal, produtoId]
      );
      const adjust = tipo === 'entrada' ? qtd : -qtd;
      await connection.query('UPDATE produtos SET estoque = estoque + ? WHERE id = ?', [adjust, produtoId]);
      await connection.commit();
      res.json({ success: true });
    } catch (err) {
      await connection.rollback();
      res.status(400).json({ error: err.message });
    } finally {
      connection.release();
    }
  });

  app.put('/api/movimentacoes/:id', checkAccess(['admin']), async (req, res) => {
    const { id } = req.params;
    const { qtd, peso, nf, responsavel, valorUnit, valorTotal, produtoId } = req.body;
    
    if (isMockMode) {
      const [oldMovs] = await dbQuery('SELECT * FROM movimentacoes WHERE id = ?', [id]) as any[];
      if (!oldMovs || oldMovs.length === 0) return res.status(404).json({ error: 'Movimentação não encontrada' });
      const oldMov = oldMovs[0];
      const revertAdjust = oldMov.tipo === 'entrada' ? -oldMov.qtd : oldMov.qtd;
      await dbQuery('UPDATE produtos SET estoque = estoque + ? WHERE id = ?', [revertAdjust, oldMov.produtoId]);
      const newAdjust = oldMov.tipo === 'entrada' ? qtd : -qtd;
      await dbQuery('UPDATE produtos SET estoque = estoque + ? WHERE id = ?', [newAdjust, produtoId]);
      await dbQuery('UPDATE movimentacoes SET qtd = ?, peso = ?, nf = ?, responsavel = ?, valorunit = ?, valortotal = ? WHERE id = ?', [qtd, peso, nf, responsavel, valorUnit, valorTotal, id]);
      return res.json({ success: true });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const [oldMovs] = await connection.query('SELECT * FROM movimentacoes WHERE id = ?', [id]) as any[];
      if (oldMovs.length === 0) throw new Error('Movimentação não encontrada');
      const oldMov = oldMovs[0];

      const revertAdjust = oldMov.tipo === 'entrada' ? -oldMov.qtd : oldMov.qtd;
      await connection.query('UPDATE produtos SET estoque = estoque + ? WHERE id = ?', [revertAdjust, oldMov.produtoId]);

      const newAdjust = oldMov.tipo === 'entrada' ? qtd : -qtd;
      await connection.query('UPDATE produtos SET estoque = estoque + ? WHERE id = ?', [newAdjust, produtoId]);

      await connection.query(
        'UPDATE movimentacoes SET qtd = ?, peso = ?, nf = ?, responsavel = ?, valorunit = ?, valortotal = ? WHERE id = ?',
        [qtd, peso, nf, responsavel, valorUnit, valorTotal, id]
      );

      await connection.commit();
      res.json({ success: true });
    } catch (err) {
      await connection.rollback();
      res.status(400).json({ error: err.message });
    } finally {
      connection.release();
    }
  });

  app.delete('/api/movimentacoes/:id', checkAccess(['admin']), async (req, res) => {
    const { id } = req.params;
    
    if (isMockMode) {
      const [movs] = await dbQuery('SELECT * FROM movimentacoes WHERE id = ?', [id]) as any[];
      if (!movs || movs.length === 0) return res.status(404).json({ error: 'Movimentação não encontrada' });
      const mov = movs[0];
      const adjust = mov.tipo === 'entrada' ? -mov.qtd : mov.qtd;
      if (mov.produtoId) await dbQuery('UPDATE produtos SET estoque = estoque + ? WHERE id = ?', [adjust, mov.produtoId]);
      await dbQuery('DELETE FROM movimentacoes WHERE id = ?', [id]);
      return res.json({ success: true });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const [movs] = await connection.query('SELECT * FROM movimentacoes WHERE id = ?', [id]) as any[];
      if (movs.length === 0) throw new Error('Movimentação não encontrada');
      const mov = movs[0];

      const adjust = mov.tipo === 'entrada' ? -mov.qtd : mov.qtd;
      if (mov.produtoId) {
        await connection.query('UPDATE produtos SET estoque = estoque + ? WHERE id = ?', [adjust, mov.produtoId]);
      }

      await connection.query('DELETE FROM movimentacoes WHERE id = ?', [id]);
      
      await connection.commit();
      res.json({ success: true });
    } catch (err) {
      await connection.rollback();
      res.status(400).json({ error: err.message });
    } finally {
      connection.release();
    }
  });

  // Movimentações Internas
  app.get('/api/movimentacoes_internas', async (req, res) => {
    const [rows] = await dbQuery('SELECT * FROM movimentacoes_internas ORDER BY id DESC LIMIT 100');
    res.json(rows);
  });

  app.post('/api/movimentacoes_internas', async (req, res) => {
    const { data, codigo, produto, tipo, qtd, peso, responsavel, destino, valorUnit, valorTotal, produtoId } = req.body;
    
    if (isMockMode) {
      await dbQuery(
        'INSERT INTO movimentacoes_internas (data, codigo, produto, tipo, qtd, peso, responsavel, destino, valorUnit, valorTotal, produtoId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [data, codigo, produto, tipo, qtd, peso, responsavel, destino, valorUnit, valorTotal, produtoId]
      );
      await dbQuery('UPDATE produtos SET estoque = estoque - ? WHERE id = ?', [qtd, produtoId]);
      return res.json({ success: true });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query(
        'INSERT INTO movimentacoes_internas (data, codigo, produto, tipo, qtd, peso, responsavel, destino, valorUnit, valorTotal, produtoId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [data, codigo, produto, tipo, qtd, peso, responsavel, destino, valorUnit, valorTotal, produtoId]
      );
      
      await connection.query('UPDATE produtos SET estoque = estoque - ? WHERE id = ?', [qtd, produtoId]);
      
      await connection.commit();
      res.json({ success: true });
    } catch (err) {
      await connection.rollback();
      res.status(400).json({ error: err.message });
    } finally {
      connection.release();
    }
  });

  app.put('/api/movimentacoes_internas/:id', checkAccess(['admin']), async (req, res) => {
    const { id } = req.params;
    const { qtd, peso, responsavel, destino, valorUnit, valorTotal, produtoId } = req.body;
    
    if (isMockMode) {
      const [oldMovs] = await dbQuery('SELECT * FROM movimentacoes_internas WHERE id = ?', [id]) as any[];
      if (!oldMovs || oldMovs.length === 0) return res.status(404).json({ error: 'Movimentação não encontrada' });
      const oldMov = oldMovs[0];
      if (oldMov.produtoId) await dbQuery('UPDATE produtos SET estoque = estoque + ? WHERE id = ?', [oldMov.qtd, oldMov.produtoId]);
      await dbQuery('UPDATE produtos SET estoque = estoque - ? WHERE id = ?', [qtd, produtoId]);
      await dbQuery('UPDATE movimentacoes_internas SET qtd = ?, peso = ?, responsavel = ?, destino = ?, valorUnit = ?, valorTotal = ?, produtoId = ? WHERE id = ?', [qtd, peso, responsavel, destino, valorUnit, valorTotal, produtoId, id]);
      return res.json({ success: true });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const [oldMovs] = await connection.query('SELECT * FROM movimentacoes_internas WHERE id = ?', [id]) as any[];
      if (oldMovs.length === 0) throw new Error('Movimentação não encontrada');
      const oldMov = oldMovs[0];

      if (oldMov.produtoId) {
        await connection.query('UPDATE produtos SET estoque = estoque + ? WHERE id = ?', [oldMov.qtd, oldMov.produtoId]);
      }

      await connection.query('UPDATE produtos SET estoque = estoque - ? WHERE id = ?', [qtd, produtoId]);

      await connection.query(
        'UPDATE movimentacoes_internas SET qtd = ?, peso = ?, responsavel = ?, destino = ?, valorUnit = ?, valorTotal = ?, produtoId = ? WHERE id = ?',
        [qtd, peso, responsavel, destino, valorUnit, valorTotal, produtoId, id]
      );

      await connection.commit();
      res.json({ success: true });
    } catch (err) {
      await connection.rollback();
      res.status(400).json({ error: err.message });
    } finally {
      connection.release();
    }
  });

  app.delete('/api/movimentacoes_internas/:id', checkAccess(['admin']), async (req, res) => {
    const { id } = req.params;
    
    if (isMockMode) {
      const [movs] = await dbQuery('SELECT * FROM movimentacoes_internas WHERE id = ?', [id]) as any[];
      if (!movs || movs.length === 0) return res.status(404).json({ error: 'Movimentação não encontrada' });
      const mov = movs[0];
      if (mov.produtoId) await dbQuery('UPDATE produtos SET estoque = estoque + ? WHERE id = ?', [mov.qtd, mov.produtoId]);
      await dbQuery('DELETE FROM movimentacoes_internas WHERE id = ?', [id]);
      return res.json({ success: true });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const [movs] = await connection.query('SELECT * FROM movimentacoes_internas WHERE id = ?', [id]) as any[];
      if (movs.length === 0) throw new Error('Movimentação não encontrada');
      const mov = movs[0];

      if (mov.produtoId) {
        await connection.query('UPDATE produtos SET estoque = estoque + ? WHERE id = ?', [mov.qtd, mov.produtoId]);
      }

      await connection.query('DELETE FROM movimentacoes_internas WHERE id = ?', [id]);
      
      await connection.commit();
      res.json({ success: true });
    } catch (err) {
      await connection.rollback();
      res.status(400).json({ error: err.message });
    } finally {
      connection.release();
    }
  });

  // Generic CRUD for Fornecedores, Funcionarios, Galpoes
  const createCrudRoutes = (tableName, columns) => {
    app.get(`/api/${tableName}`, async (req, res) => {
      const [rows] = await dbQuery(`SELECT * FROM ${tableName}`);
      res.json(rows);
    });
    app.post(`/api/${tableName}`, checkAccess(['admin']), async (req, res) => {
      const values = columns.map(col => req.body[col]);
      try {
        const [result] = await dbQuery(`INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`, values) as any[];
        res.json({ id: result.insertId });
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    });
    app.put(`/api/${tableName}/:id`, checkAccess(['admin']), async (req, res) => {
      const values = columns.map(col => req.body[col]);
      await dbQuery(`UPDATE ${tableName} SET ${columns.map(col => `${col} = ?`).join(', ')} WHERE id = ?`, [...values, req.params.id]);
      res.json({ success: true });
    });
    app.delete(`/api/${tableName}/:id`, checkAccess(['admin']), async (req, res) => {
      await dbQuery(`DELETE FROM ${tableName} WHERE id = ?`, [req.params.id]);
      res.json({ success: true });
    });
  };

  createCrudRoutes('fornecedores', ['nome', 'telefone', 'email']);
  createCrudRoutes('galpoes', ['nome', 'descricao']);
  
  // Special handling for funcionarios (usuario) due to password
  app.get('/api/funcionarios', checkAccess(['admin']), async (req, res) => {
    const [rows] = await dbQuery('SELECT id, nome, email, registro, funcao, nivel_acesso FROM usuario');
    // Map nivel_acesso to nivel for frontend
    const mapped = (rows as any[]).map(r => ({ ...r, nivel: r.nivel_acesso }));
    res.json(mapped);
  });
  app.post('/api/funcionarios', checkAccess(['admin']), async (req, res) => {
    const { nome, senha, registro, funcao, nivel } = req.body;
    try {
      const [result] = await dbQuery('INSERT INTO usuario (nome, senha, registro, funcao, nivel_acesso) VALUES (?, ?, ?, ?, ?)', [nome, senha, registro, funcao, nivel]) as any[];
      res.json({ id: result.insertId });
    } catch (err) {
      res.status(400).json({ error: 'Nome de usuário já existe ou dados inválidos.' });
    }
  });
  app.put('/api/funcionarios/:id', checkAccess(['admin']), async (req, res) => {
    const { nome, senha, registro, funcao, nivel } = req.body;
    try {
      if (senha) {
        await dbQuery('UPDATE usuario SET nome = ?, senha = ?, registro = ?, funcao = ?, nivel_acesso = ? WHERE id = ?', [nome, senha, registro, funcao, nivel, req.params.id]);
      } else {
        await dbQuery('UPDATE usuario SET nome = ?, registro = ?, funcao = ?, nivel_acesso = ? WHERE id = ?', [nome, registro, funcao, nivel, req.params.id]);
      }
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  app.delete('/api/funcionarios/:id', checkAccess(['admin']), async (req, res) => {
    await dbQuery('DELETE FROM usuario WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  });


  // Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
