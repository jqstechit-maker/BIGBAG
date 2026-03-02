import express from 'express';
import { createServer as createViteServer } from 'vite';
import pg from 'pg';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import session from 'express-session';

const { Pool } = pg;
dotenv.config();

// Verificação de variáveis de ambiente obrigatórias
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'DB_PORT'];
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
    { id: 4, codigo: 'VM-001', descricao: 'Tecido Especial', tipo: 'Fardo', fornecedorId: 4, galpaoId: 2, estoque: 100, min: 10, pesoUnit: 2.0, valorUnit: 80.0 },
    { id: 5, codigo: 'VT-002', descricao: 'Linner Reforçado', tipo: 'Fardo', fornecedorId: 5, galpaoId: 1, estoque: 100, min: 10, pesoUnit: 2.0, valorUnit: 90.0 }
  ],
  movimentacoes: [
    { id: 1, data: '01/03/2026 10:00:00', codigo: 'VT-001', produto: 'Tecido', fornecedor: 'Fornecedor Alfa', tipo: 'entrada', qtd: 100, peso: 200.0, nf: 'NF-101', responsavel: 'admin', valorUnit: 50.0, valorTotal: 5000.0, produtoId: 1 },
    { id: 2, data: '01/03/2026 10:05:00', codigo: 'VL-001', produto: 'Linner', fornecedor: 'Fornecedor Beta', tipo: 'entrada', qtd: 100, peso: 200.0, nf: 'NF-102', responsavel: 'admin', valorUnit: 60.0, valorTotal: 6000.0, produtoId: 2 },
    { id: 3, data: '01/03/2026 10:10:00', codigo: 'VA-001', produto: 'Alça', fornecedor: 'Fornecedor Gama', tipo: 'entrada', qtd: 100, peso: 200.0, nf: 'NF-103', responsavel: 'admin', valorUnit: 70.0, valorTotal: 7000.0, produtoId: 3 },
    { id: 4, data: '01/03/2026 10:15:00', codigo: 'VM-001', produto: 'Tecido Especial', fornecedor: 'Fornecedor Delta', tipo: 'entrada', qtd: 100, peso: 200.0, nf: 'NF-104', responsavel: 'admin', valorUnit: 80.0, valorTotal: 8000.0, produtoId: 4 },
    { id: 5, data: '01/03/2026 10:20:00', codigo: 'VT-002', produto: 'Linner Reforçado', fornecedor: 'Fornecedor Epsilon', tipo: 'entrada', qtd: 100, peso: 200.0, nf: 'NF-105', responsavel: 'admin', valorUnit: 90.0, valorTotal: 9000.0, produtoId: 5 },
    { id: 6, data: '01/03/2026 14:00:00', codigo: 'VT-001', produto: 'Tecido', fornecedor: 'Fornecedor Alfa', tipo: 'saida', qtd: 50, peso: 100.0, nf: 'NF-S01', responsavel: 'João Silva', valorUnit: 50.0, valorTotal: 2500.0, produtoId: 1 },
    { id: 7, data: '01/03/2026 14:05:00', codigo: 'VL-001', produto: 'Linner', fornecedor: 'Fornecedor Beta', tipo: 'saida', qtd: 50, peso: 100.0, nf: 'NF-S02', responsavel: 'João Silva', valorUnit: 60.0, valorTotal: 3000.0, produtoId: 2 },
    { id: 8, data: '01/03/2026 14:10:00', codigo: 'VA-001', produto: 'Alça', fornecedor: 'Fornecedor Gama', tipo: 'saida', qtd: 50, peso: 100.0, nf: 'NF-S03', responsavel: 'João Silva', valorUnit: 70.0, valorTotal: 3500.0, produtoId: 3 }
  ]
};

function createMockPool() {
  const queryHandler = async (sql: string, params: any[] = []) => {
    const lowerSql = sql.toLowerCase();
    
    // SELECT USUARIO
    if (lowerSql.includes('from usuario')) {
      if (lowerSql.includes('nome = $1 and senha = $2')) {
        const user = mockData.usuario.find((u: any) => u.nome === params[0] && u.senha === params[1]);
        return { rows: user ? [user] : [] };
      }
      if (lowerSql.includes('where nome = $1')) {
        const user = mockData.usuario.find((u: any) => u.nome === params[0]);
        return { rows: user ? [user] : [] };
      }
      if (lowerSql.includes('where id = $1')) {
        const user = mockData.usuario.find((u: any) => u.id === Number(params[0]));
        return { rows: user ? [user] : [] };
      }
      return { rows: mockData.usuario };
    }

    // SELECT OTHERS
    if (lowerSql.includes('from produtos')) {
      if (lowerSql.includes('where id = $1')) {
        const item = mockData.produtos.find((p: any) => p.id === Number(params[0]));
        return { rows: item ? [item] : [] };
      }
      return { rows: mockData.produtos };
    }
    if (lowerSql.includes('from fornecedores')) {
      if (lowerSql.includes('where id = $1')) {
        const item = mockData.fornecedores.find((f: any) => f.id === Number(params[0]));
        return { rows: item ? [item] : [] };
      }
      return { rows: mockData.fornecedores };
    }
    if (lowerSql.includes('from galpoes')) {
      if (lowerSql.includes('where id = $1')) {
        const item = mockData.galpoes.find((g: any) => g.id === Number(params[0]));
        return { rows: item ? [item] : [] };
      }
      return { rows: mockData.galpoes };
    }
    if (lowerSql.includes('from movimentacoes')) {
      if (lowerSql.includes('where id = $1')) {
        const item = mockData.movimentacoes.find((m: any) => m.id === Number(params[0]));
        return { rows: item ? [item] : [] };
      }
      const sorted = [...mockData.movimentacoes].sort((a, b) => b.id - a.id);
      return { rows: sorted };
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
      return { rows: [newUser] };
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
      return { rows: [newProd] };
    }

    // INSERT FORNECEDORES
    if (lowerSql.includes('insert into fornecedores')) {
      const newItem = { id: mockData.fornecedores.length + 1, nome: params[0], telefone: params[1], email: params[2] };
      mockData.fornecedores.push(newItem);
      return { rows: [newItem] };
    }

    // INSERT GALPOES
    if (lowerSql.includes('insert into galpoes')) {
      const newItem = { id: mockData.galpoes.length + 1, nome: params[0], descricao: params[1] };
      mockData.galpoes.push(newItem);
      return { rows: [newItem] };
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
      return { rows: [newItem] };
    }

    // UPDATE PRODUTOS ESTOQUE
    if (lowerSql.includes('update produtos set estoque = estoque + $1 where id = $2')) {
      const adjust = Number(params[0]);
      const id = Number(params[1]);
      const prod = mockData.produtos.find((p: any) => p.id === id);
      if (prod) prod.estoque += adjust;
      return { rowCount: 1 };
    }

    // UPDATE PRODUTOS FULL
    if (lowerSql.includes('update produtos set codigo = $1')) {
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
      return { rowCount: 1 };
    }

    // UPDATE USUARIO
    if (lowerSql.includes('update usuario set nome = $1')) {
      const id = Number(params[params.length - 1]);
      const index = mockData.usuario.findIndex((u: any) => u.id === id);
      if (index !== -1) {
        if (lowerSql.includes('senha = $2')) {
          mockData.usuario[index] = { ...mockData.usuario[index], nome: params[0], senha: params[1], registro: params[2], funcao: params[3], nivel_acesso: params[4] };
        } else {
          mockData.usuario[index] = { ...mockData.usuario[index], nome: params[0], registro: params[1], funcao: params[2], nivel_acesso: params[3] };
        }
      }
      return { rowCount: 1 };
    }

    // UPDATE MOVIMENTACOES
    if (lowerSql.includes('update movimentacoes set qtd = $1')) {
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
      return { rowCount: 1 };
    }

    // GENERIC UPDATE
    if (lowerSql.includes('update fornecedores')) {
      const id = Number(params[params.length - 1]);
      const index = mockData.fornecedores.findIndex((f: any) => f.id === id);
      if (index !== -1) mockData.fornecedores[index] = { ...mockData.fornecedores[index], nome: params[0], telefone: params[1], email: params[2] };
      return { rowCount: 1 };
    }
    if (lowerSql.includes('update galpoes')) {
      const id = Number(params[params.length - 1]);
      const index = mockData.galpoes.findIndex((g: any) => g.id === id);
      if (index !== -1) mockData.galpoes[index] = { ...mockData.galpoes[index], nome: params[0], descricao: params[1] };
      return { rowCount: 1 };
    }

    // DELETE
    if (lowerSql.includes('delete from')) {
      const id = Number(params[0]);
      if (lowerSql.includes('produtos')) mockData.produtos = mockData.produtos.filter((p: any) => p.id !== id);
      if (lowerSql.includes('fornecedores')) mockData.fornecedores = mockData.fornecedores.filter((f: any) => f.id !== id);
      if (lowerSql.includes('galpoes')) mockData.galpoes = mockData.galpoes.filter((g: any) => g.id !== id);
      if (lowerSql.includes('usuario')) mockData.usuario = mockData.usuario.filter((u: any) => u.id !== id);
      if (lowerSql.includes('movimentacoes')) mockData.movimentacoes = mockData.movimentacoes.filter((m: any) => m.id !== id);
      return { rowCount: 1 };
    }

    return { rows: [] };
  };

  return {
    query: queryHandler,
    connect: async () => ({
      query: queryHandler,
      release: () => {}
    })
  };
}

try {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME}`,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
} catch (err) {
  console.log('Iniciando em MODO DE TESTE (Banco de dados em memória)');
  isMockMode = true;
  pool = createMockPool();
}

async function initializeDatabase() {
  console.log('--- DATABASE INITIALIZATION START ---');
  if (isMockMode) {
    console.log('Database initialization skipped in Mock Mode.');
    console.log('--- DATABASE INITIALIZATION END (MOCK) ---');
    return;
  }

  try {
    console.log('Connecting to PostgreSQL pool...');
    const client = await pool.connect();
    console.log('PostgreSQL connection established.');
    try {
      console.log('Creating tables if they do not exist...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS fornecedores (
          id SERIAL PRIMARY KEY,
          nome VARCHAR(255) NOT NULL,
          telefone VARCHAR(255),
          email VARCHAR(255)
        );
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS galpoes (
          id SERIAL PRIMARY KEY,
          nome VARCHAR(255) NOT NULL,
          descricao TEXT
        );
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS usuario (
          id SERIAL PRIMARY KEY,
          nome VARCHAR(255) UNIQUE NOT NULL,
          email VARCHAR(255),
          senha VARCHAR(255) NOT NULL,
          registro VARCHAR(255),
          funcao VARCHAR(255),
          nivel_acesso VARCHAR(50) NOT NULL
        );
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS produtos (
          id SERIAL PRIMARY KEY,
          codigo VARCHAR(255) UNIQUE NOT NULL,
          descricao TEXT NOT NULL,
          tipo VARCHAR(255),
          fornecedorId INT REFERENCES fornecedores(id),
          galpaoId INT REFERENCES galpoes(id),
          estoque INT DEFAULT 0,
          min INT DEFAULT 0,
          pesoUnit DECIMAL(10, 3) DEFAULT 0,
          valorUnit DECIMAL(10, 3) DEFAULT 0
        );
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS movimentacoes (
          id SERIAL PRIMARY KEY,
          data VARCHAR(255) NOT NULL,
          codigo VARCHAR(255) NOT NULL,
          produto TEXT NOT NULL,
          fornecedor VARCHAR(255),
          tipo VARCHAR(50) NOT NULL,
          qtd INT NOT NULL,
          peso DECIMAL(10, 3),
          nf VARCHAR(255),
          responsavel VARCHAR(255),
          valorUnit DECIMAL(10, 3),
          valorTotal DECIMAL(10, 3),
          produtoId INT REFERENCES produtos(id) ON DELETE SET NULL
        );
      `);

      console.log('Checking for default admin user...');
      // Insert default admin if not exists
      const { rows } = await client.query('SELECT id FROM usuario WHERE nome = $1', ['admin']);
      if (rows.length === 0) {
        console.log('Default admin user not found. Creating initial data...');
        
        // Users
        await client.query('INSERT INTO usuario (nome, email, senha, registro, funcao, nivel_acesso) VALUES ($1, $2, $3, $4, $5, $6)', 
          ['admin', 'admin@admin', 'admin', '000', 'Admin', 'admin']);
        await client.query('INSERT INTO usuario (nome, email, senha, registro, funcao, nivel_acesso) VALUES ($1, $2, $3, $4, $5, $6)', 
          ['João Silva', 'joao@virtude.com', '123', '001', 'Auxiliar de Produção', 'funcionario']);
        await client.query('INSERT INTO usuario (nome, email, senha, registro, funcao, nivel_acesso) VALUES ($1, $2, $3, $4, $5, $6)', 
          ['Maria Santos', 'maria@virtude.com', '123', '002', 'Gerente de Logística', 'admin']);
        
        // Warehouses
        await client.query('INSERT INTO galpoes (nome, descricao) VALUES ($1, $2)', ['Galpão Norte', 'Armazenamento Principal']);
        await client.query('INSERT INTO galpoes (nome, descricao) VALUES ($1, $2)', ['Galpão Sul', 'Armazenamento Secundário']);

        // Suppliers
        await client.query('INSERT INTO fornecedores (nome, telefone, email) VALUES ($1, $2, $3)', ['Fornecedor Alfa', '(11) 1111-1111', 'alfa@forn.com']);
        await client.query('INSERT INTO fornecedores (nome, telefone, email) VALUES ($1, $2, $3)', ['Fornecedor Beta', '(22) 2222-2222', 'beta@forn.com']);
        await client.query('INSERT INTO fornecedores (nome, telefone, email) VALUES ($1, $2, $3)', ['Fornecedor Gama', '(33) 3333-3333', 'gama@forn.com']);
        await client.query('INSERT INTO fornecedores (nome, telefone, email) VALUES ($1, $2, $3)', ['Fornecedor Delta', '(44) 4444-4444', 'delta@forn.com']);
        await client.query('INSERT INTO fornecedores (nome, telefone, email) VALUES ($1, $2, $3)', ['Fornecedor Epsilon', '(55) 5555-5555', 'epsilon@forn.com']);

        // Products
        await client.query('INSERT INTO produtos (codigo, descricao, tipo, fornecedorId, galpaoId, estoque, min, pesoUnit, valorUnit) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)', 
          ['VT-001', 'Tecido', 'Fardo', 1, 1, 50, 10, 2.0, 50.0]);
        await client.query('INSERT INTO produtos (codigo, descricao, tipo, fornecedorId, galpaoId, estoque, min, pesoUnit, valorUnit) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)', 
          ['VL-001', 'Linner', 'Fardo', 2, 1, 50, 10, 2.0, 60.0]);
        await client.query('INSERT INTO produtos (codigo, descricao, tipo, fornecedorId, galpaoId, estoque, min, pesoUnit, valorUnit) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)', 
          ['VA-001', 'Alça', 'Fardo', 3, 2, 50, 10, 2.0, 70.0]);

        console.log('Initial data created successfully.');
      } else {
        console.log('Default admin user already exists.');
      }
      console.log('--- DATABASE INITIALIZATION END (SUCCESS) ---');
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('DATABASE INITIALIZATION ERROR:', err.message);
    console.log('Falha ao conectar ao PostgreSQL. Ativando MODO DE TESTE.');
    isMockMode = true;
    pool = createMockPool();
    console.log('--- DATABASE INITIALIZATION END (FALLBACK TO MOCK) ---');
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

  app.use(cors());
  app.use(express.json());
  
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'virtude-secret-key-2026',
    resave: false,
    saveUninitialized: false,
    name: 'virtude_session',
    proxy: true,
    cookie: {
      // For AI Studio Preview, we need SameSite=None and Secure=True
      secure: true, 
      httpOnly: true,
      sameSite: 'none',
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

  // Health check for Hostinger
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
      pool.query('SELECT id, nome, email, nivel_acesso FROM usuario WHERE id = $1', [req.session.user_id])
        .then(({ rows }: any) => {
          if (rows.length > 0) {
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
    const { rows } = await pool.query('SELECT * FROM usuario WHERE nome = $1 AND senha = $2', [username, password]) as any;
    if (rows.length > 0) {
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
          nivel: user.nivel_acesso // Keep 'nivel' for frontend compatibility
        } 
      });
    } else {
      res.status(401).json({ success: false, message: 'Credenciais inválidas' });
    }
  });

  // Logout
  app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ success: false });
      res.json({ success: true });
    });
  });

  // Produtos
  app.get('/api/produtos', async (req, res) => {
    const { rows } = await pool.query('SELECT id, codigo, descricao, tipo, fornecedorid as "fornecedorId", galpaoid as "galpaoId", estoque, min, pesounit as "pesoUnit", valorunit as "valorUnit" FROM produtos');
    res.json(rows);
  });

  app.post('/api/produtos', checkAccess(['admin']), async (req, res) => {
    const { codigo, descricao, tipo, fornecedorId, galpaoId, min, pesoUnit, valorUnit } = req.body;
    try {
      const { rows } = await pool.query(
        'INSERT INTO produtos (codigo, descricao, tipo, fornecedorid, galpaoid, min, pesounit, valorunit) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
        [codigo, descricao, tipo, fornecedorId, galpaoId, min, pesoUnit, valorUnit]
      ) as any;
      res.json({ id: rows[0].id });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  
  app.put('/api/produtos/:id', checkAccess(['admin']), async (req, res) => {
    const { id } = req.params;
    const { codigo, descricao, tipo, fornecedorId, galpaoId, min, pesoUnit, valorUnit } = req.body;
    await pool.query(
      'UPDATE produtos SET codigo = $1, descricao = $2, tipo = $3, fornecedorid = $4, galpaoid = $5, min = $6, pesounit = $7, valorunit = $8 WHERE id = $9',
      [codigo, descricao, tipo, fornecedorId, galpaoId, min, pesoUnit, valorUnit, id]
    );
    res.json({ success: true });
  });

  app.delete('/api/produtos/:id', checkAccess(['admin']), async (req, res) => {
    await pool.query('DELETE FROM produtos WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  });

  // Movimentações
  app.get('/api/movimentacoes', async (req, res) => {
    const { rows } = await pool.query('SELECT id, data, codigo, produto, fornecedor, tipo, qtd, peso, nf, responsavel, valorunit as "valorUnit", valortotal as "valorTotal", produtoid as "produtoId" FROM movimentacoes ORDER BY id DESC');
    res.json(rows);
  });

  app.post('/api/movimentacoes', async (req, res) => {
    const { data, codigo, produto, fornecedor, tipo, qtd, peso, nf, responsavel, valorUnit, valorTotal, produtoId } = req.body;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        'INSERT INTO movimentacoes (data, codigo, produto, fornecedor, tipo, qtd, peso, nf, responsavel, valorunit, valortotal, produtoid) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
        [data, codigo, produto, fornecedor, tipo, qtd, peso, nf, responsavel, valorUnit, valorTotal, produtoId]
      );
      const adjust = tipo === 'entrada' ? qtd : -qtd;
      await client.query('UPDATE produtos SET estoque = estoque + $1 WHERE id = $2', [adjust, produtoId]);
      await client.query('COMMIT');
      res.json({ success: true });
    } catch (err) {
      await client.query('ROLLBACK');
      res.status(400).json({ error: err.message });
    } finally {
      client.release();
    }
  });

  app.put('/api/movimentacoes/:id', checkAccess(['admin']), async (req, res) => {
    const { id } = req.params;
    const { qtd, peso, nf, responsavel, valorUnit, valorTotal, produtoId } = req.body;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Get old movement to adjust stock
      const { rows: oldMovs } = await client.query('SELECT id, data, codigo, produto, fornecedor, tipo, qtd, peso, nf, responsavel, valorunit as "valorUnit", valortotal as "valorTotal", produtoid as "produtoId" FROM movimentacoes WHERE id = $1', [id]);
      if (oldMovs.length === 0) throw new Error('Movimentação não encontrada');
      const oldMov = oldMovs[0];

      // Revert old stock
      const revertAdjust = oldMov.tipo === 'entrada' ? -oldMov.qtd : oldMov.qtd;
      await client.query('UPDATE produtos SET estoque = estoque + $1 WHERE id = $2', [revertAdjust, oldMov.produtoId]);

      // Apply new stock
      const newAdjust = oldMov.tipo === 'entrada' ? qtd : -qtd;
      await client.query('UPDATE produtos SET estoque = estoque + $1 WHERE id = $2', [newAdjust, produtoId]);

      // Update movement
      await client.query(
        'UPDATE movimentacoes SET qtd = $1, peso = $2, nf = $3, responsavel = $4, valorunit = $5, valortotal = $6 WHERE id = $7',
        [qtd, peso, nf, responsavel, valorUnit, valorTotal, id]
      );

      await client.query('COMMIT');
      res.json({ success: true });
    } catch (err) {
      await client.query('ROLLBACK');
      res.status(400).json({ error: err.message });
    } finally {
      client.release();
    }
  });

  app.delete('/api/movimentacoes/:id', checkAccess(['admin']), async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const { rows: movs } = await client.query('SELECT id, data, codigo, produto, fornecedor, tipo, qtd, peso, nf, responsavel, valorunit as "valorUnit", valortotal as "valorTotal", produtoid as "produtoId" FROM movimentacoes WHERE id = $1', [id]);
      if (movs.length === 0) throw new Error('Movimentação não encontrada');
      const mov = movs[0];

      // Revert stock
      const adjust = mov.tipo === 'entrada' ? -mov.qtd : mov.qtd;
      if (mov.produtoId) {
        await client.query('UPDATE produtos SET estoque = estoque + $1 WHERE id = $2', [adjust, mov.produtoId]);
      }

      await client.query('DELETE FROM movimentacoes WHERE id = $1', [id]);
      
      await client.query('COMMIT');
      res.json({ success: true });
    } catch (err) {
      await client.query('ROLLBACK');
      res.status(400).json({ error: err.message });
    } finally {
      client.release();
    }
  });

  // Generic CRUD for Fornecedores, Funcionarios, Galpoes
  const createCrudRoutes = (tableName, columns) => {
    app.get(`/api/${tableName}`, async (req, res) => {
      const { rows } = await pool.query(`SELECT * FROM ${tableName}`);
      res.json(rows);
    });
    app.post(`/api/${tableName}`, checkAccess(['admin']), async (req, res) => {
      const values = columns.map(col => req.body[col]);
      const { rows } = await pool.query(`INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${columns.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING id`, values) as any;
      res.json({ id: rows[0].id });
    });
    app.put(`/api/${tableName}/:id`, checkAccess(['admin']), async (req, res) => {
      const values = columns.map(col => req.body[col]);
      await pool.query(`UPDATE ${tableName} SET ${columns.map((col, i) => `${col} = $${i + 1}`).join(', ')} WHERE id = $${columns.length + 1}`, [...values, req.params.id]);
      res.json({ success: true });
    });
    app.delete(`/api/${tableName}/:id`, checkAccess(['admin']), async (req, res) => {
      await pool.query(`DELETE FROM ${tableName} WHERE id = $1`, [req.params.id]);
      res.json({ success: true });
    });
  };

  createCrudRoutes('fornecedores', ['nome', 'telefone', 'email']);
  createCrudRoutes('galpoes', ['nome', 'descricao']);
  
  // Special handling for funcionarios (usuario) due to password
  app.get('/api/funcionarios', checkAccess(['admin']), async (req, res) => {
    const { rows } = await pool.query('SELECT id, nome, email, registro, funcao, nivel_acesso FROM usuario');
    // Map nivel_acesso to nivel for frontend
    const mapped = (rows as any[]).map(r => ({ ...r, nivel: r.nivel_acesso }));
    res.json(mapped);
  });
  app.post('/api/funcionarios', checkAccess(['admin']), async (req, res) => {
    const { nome, senha, registro, funcao, nivel } = req.body;
    try {
      const { rows } = await pool.query('INSERT INTO usuario (nome, senha, registro, funcao, nivel_acesso) VALUES ($1, $2, $3, $4, $5) RETURNING id', [nome, senha, registro, funcao, nivel]) as any;
      res.json({ id: rows[0].id });
    } catch (err) {
      res.status(400).json({ error: 'Nome de usuário já existe ou dados inválidos.' });
    }
  });
  app.put('/api/funcionarios/:id', checkAccess(['admin']), async (req, res) => {
    const { nome, senha, registro, funcao, nivel } = req.body;
    try {
      if (senha) {
        await pool.query('UPDATE usuario SET nome = $1, senha = $2, registro = $3, funcao = $4, nivel_acesso = $5 WHERE id = $6', [nome, senha, registro, funcao, nivel, req.params.id]);
      } else {
        await pool.query('UPDATE usuario SET nome = $1, registro = $2, funcao = $3, nivel_acesso = $4 WHERE id = $5', [nome, registro, funcao, nivel, req.params.id]);
      }
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  app.delete('/api/funcionarios/:id', checkAccess(['admin']), async (req, res) => {
    await pool.query('DELETE FROM usuario WHERE id = $1', [req.params.id]);
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
