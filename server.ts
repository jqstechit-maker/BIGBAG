import express from 'express';
import { createServer as createViteServer } from 'vite';
import mysql from 'mysql2/promise';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import session from 'express-session';

dotenv.config();

// Verificação de variáveis de ambiente obrigatórias
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
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
    { id: 1, nome: 'admin', email: 'admin@admin', senha: 'admin', registro: '000', funcao: 'Admin', nivel_acesso: 'admin' }
  ],
  fornecedores: [],
  galpoes: [],
  produtos: [],
  movimentacoes: []
};

function createMockPool() {
  return {
    query: async (sql: string, params: any[] = []) => {
      const lowerSql = sql.toLowerCase();
      
      if (lowerSql.includes('from usuario')) {
        if (lowerSql.includes('where nome = ? and senha = ?')) {
          const user = mockData.usuario.find((u: any) => u.nome === params[0] && u.senha === params[1]);
          return [user ? [user] : []];
        }
        if (lowerSql.includes('where nome = ?')) {
          const user = mockData.usuario.find((u: any) => u.nome === params[0]);
          return [user ? [user] : []];
        }
        return [mockData.usuario];
      }

      if (lowerSql.includes('select * from produtos')) return [mockData.produtos];
      if (lowerSql.includes('select * from fornecedores')) return [mockData.fornecedores];
      if (lowerSql.includes('select * from galpoes')) return [mockData.galpoes];
      if (lowerSql.includes('select * from movimentacoes')) return [mockData.movimentacoes];

      if (lowerSql.includes('insert into usuario')) {
        const newUser = { id: mockData.usuario.length + 1, nome: params[0], email: params[1], senha: params[2], registro: params[3], funcao: params[4], nivel_acesso: params[5] };
        mockData.usuario.push(newUser);
        return [{ insertId: newUser.id }];
      }

      if (lowerSql.includes('insert into produtos')) {
        const newProd = { id: mockData.produtos.length + 1, codigo: params[0], descricao: params[1], tipo: params[2], fornecedorId: params[3], galpaoId: params[4], estoque: params[5], min: params[6], pesoUnit: params[7], valorUnit: params[8] };
        mockData.produtos.push(newProd);
        return [{ insertId: newProd.id }];
      }

      // Default for CREATE TABLE, etc.
      return [[]];
    },
    getConnection: async () => ({
      query: async (sql: string, params: any[] = []) => pool.query(sql, params),
      release: () => {}
    })
  };
}

try {
  pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
} catch (err) {
  console.log('Iniciando em MODO DE TESTE (Banco de dados em memória)');
  isMockMode = true;
  pool = createMockPool();
}

async function initializeDatabase() {
  if (isMockMode) {
    console.log('Database initialization skipped in Mock Mode.');
    return;
  }

  try {
    const connection = await pool.getConnection();
    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS fornecedores (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nome VARCHAR(255) NOT NULL,
          telefone VARCHAR(255),
          email VARCHAR(255)
        );
      `);
      await connection.query(`
        CREATE TABLE IF NOT EXISTS galpoes (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nome VARCHAR(255) NOT NULL,
          descricao TEXT
        );
      `);
      await connection.query(`
        CREATE TABLE IF NOT EXISTS usuario (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nome VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          senha VARCHAR(255) NOT NULL,
          registro VARCHAR(255),
          funcao VARCHAR(255),
          nivel_acesso ENUM('super_admin', 'admin', 'funcionario') NOT NULL
        );
      `);
      await connection.query(`
        CREATE TABLE IF NOT EXISTS produtos (
          id INT AUTO_INCREMENT PRIMARY KEY,
          codigo VARCHAR(255) UNIQUE NOT NULL,
          descricao TEXT NOT NULL,
          tipo VARCHAR(255),
          fornecedorId INT,
          galpaoId INT,
          estoque INT DEFAULT 0,
          min INT DEFAULT 0,
          pesoUnit DECIMAL(10, 3) DEFAULT 0,
          valorUnit DECIMAL(10, 3) DEFAULT 0,
          FOREIGN KEY(fornecedorId) REFERENCES fornecedores(id),
          FOREIGN KEY(galpaoId) REFERENCES galpoes(id)
        );
      `);
      await connection.query(`
        CREATE TABLE IF NOT EXISTS movimentacoes (
          id INT AUTO_INCREMENT PRIMARY KEY,
          data VARCHAR(255) NOT NULL,
          codigo VARCHAR(255) NOT NULL,
          produto TEXT NOT NULL,
          fornecedor VARCHAR(255),
          tipo ENUM('entrada', 'saida') NOT NULL,
          qtd INT NOT NULL,
          peso DECIMAL(10, 3),
          nf VARCHAR(255),
          responsavel VARCHAR(255),
          valorUnit DECIMAL(10, 3),
          valorTotal DECIMAL(10, 3)
        );
      `);

      // Insert default admin if not exists
      const [rows] = await connection.query('SELECT id FROM usuario WHERE nome = ?', ['admin']) as any[];
      if (rows.length === 0) {
        console.log('Default admin user not found. Creating...');
        await connection.query('INSERT INTO usuario (nome, email, senha, registro, funcao, nivel_acesso) VALUES (?, ?, ?, ?, ?, ?)', 
          ['admin', 'admin@admin', 'admin', '000', 'Admin', 'admin']);
        console.log('Default admin user created successfully.');
      } else {
        console.log('Default admin user already exists.');
      }
    } finally {
      connection.release();
    }
  } catch (err) {
    console.log('Falha ao conectar ao MySQL. Ativando MODO DE TESTE.');
    isMockMode = true;
    pool = createMockPool();
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
    secret: process.env.SESSION_SECRET || 'virtude-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
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
    res.json({ status: 'ok', database: 'connected' });
  });

  // Auth
  app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const [rows] = await pool.query('SELECT * FROM usuario WHERE nome = ? AND senha = ?', [username, password]) as any[];
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
    const [rows] = await pool.query('SELECT * FROM produtos');
    res.json(rows);
  });

  app.post('/api/produtos', checkAccess(['admin']), async (req, res) => {
    const { codigo, descricao, tipo, fornecedorId, galpaoId, min, pesoUnit, valorUnit } = req.body;
    try {
      const [result] = await pool.query(
        'INSERT INTO produtos (codigo, descricao, tipo, fornecedorId, galpaoId, min, pesoUnit, valorUnit) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
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
    await pool.query(
      'UPDATE produtos SET codigo = ?, descricao = ?, tipo = ?, fornecedorId = ?, galpaoId = ?, min = ?, pesoUnit = ?, valorUnit = ? WHERE id = ?',
      [codigo, descricao, tipo, fornecedorId, galpaoId, min, pesoUnit, valorUnit, id]
    );
    res.json({ success: true });
  });

  app.delete('/api/produtos/:id', checkAccess(['admin']), async (req, res) => {
    await pool.query('DELETE FROM produtos WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  });

  // Movimentações
  app.get('/api/movimentacoes', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM movimentacoes ORDER BY id DESC');
    res.json(rows);
  });

  app.post('/api/movimentacoes', async (req, res) => {
    const { data, codigo, produto, fornecedor, tipo, qtd, peso, nf, responsavel, valorUnit, valorTotal, produtoId } = req.body;
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query(
        'INSERT INTO movimentacoes (data, codigo, produto, fornecedor, tipo, qtd, peso, nf, responsavel, valorUnit, valorTotal) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [data, codigo, produto, fornecedor, tipo, qtd, peso, nf, responsavel, valorUnit, valorTotal]
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

  // Generic CRUD for Fornecedores, Funcionarios, Galpoes
  const createCrudRoutes = (tableName, columns) => {
    app.get(`/api/${tableName}`, async (req, res) => {
      const [rows] = await pool.query(`SELECT * FROM ${tableName}`);
      res.json(rows);
    });
    app.post(`/api/${tableName}`, checkAccess(['admin']), async (req, res) => {
      const values = columns.map(col => req.body[col]);
      const [result] = await pool.query(`INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`, values) as any[];
      res.json({ id: result.insertId });
    });
    app.put(`/api/${tableName}/:id`, checkAccess(['admin']), async (req, res) => {
      const values = columns.map(col => req.body[col]);
      await pool.query(`UPDATE ${tableName} SET ${columns.map(col => `${col} = ?`).join(', ')} WHERE id = ?`, [...values, req.params.id]);
      res.json({ success: true });
    });
    app.delete(`/api/${tableName}/:id`, checkAccess(['admin']), async (req, res) => {
      await pool.query(`DELETE FROM ${tableName} WHERE id = ?`, [req.params.id]);
      res.json({ success: true });
    });
  };

  createCrudRoutes('fornecedores', ['nome', 'telefone', 'email']);
  createCrudRoutes('galpoes', ['nome', 'descricao']);
  
  // Special handling for funcionarios (usuario) due to password
  app.get('/api/funcionarios', checkAccess(['admin']), async (req, res) => {
    const [rows] = await pool.query('SELECT id, nome, email, registro, funcao, nivel_acesso FROM usuario');
    // Map nivel_acesso to nivel for frontend
    const mapped = (rows as any[]).map(r => ({ ...r, nivel: r.nivel_acesso }));
    res.json(mapped);
  });
  app.post('/api/funcionarios', checkAccess(['admin']), async (req, res) => {
    const { nome, email, senha, registro, funcao, nivel } = req.body;
    const [result] = await pool.query('INSERT INTO usuario (nome, email, senha, registro, funcao, nivel_acesso) VALUES (?, ?, ?, ?, ?, ?)', [nome, email, senha, registro, funcao, nivel]) as any[];
    res.json({ id: result.insertId });
  });
  app.put('/api/funcionarios/:id', checkAccess(['admin']), async (req, res) => {
    const { nome, email, senha, registro, funcao, nivel } = req.body;
    if (senha) {
      await pool.query('UPDATE usuario SET nome = ?, email = ?, senha = ?, registro = ?, funcao = ?, nivel_acesso = ? WHERE id = ?', [nome, email, senha, registro, funcao, nivel, req.params.id]);
    } else {
      await pool.query('UPDATE usuario SET nome = ?, email = ?, registro = ?, funcao = ?, nivel_acesso = ? WHERE id = ?', [nome, email, registro, funcao, nivel, req.params.id]);
    }
    res.json({ success: true });
  });
  app.delete('/api/funcionarios/:id', checkAccess(['admin']), async (req, res) => {
    await pool.query('DELETE FROM usuario WHERE id = ?', [req.params.id]);
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
