import express from 'express';
import { createServer as createViteServer } from 'vite';
import mysql from 'mysql2/promise';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import session from 'express-session';

dotenv.config();

// Diagnóstico de Variáveis de Ambiente
console.log('--- Verificação de Conexão ---');
console.log('DB_HOST:', process.env.DB_HOST || 'Não definido (usando localhost)');
console.log('DB_USER:', process.env.DB_USER || 'Não definido (usando u609303672_virt)');
console.log('DB_NAME:', process.env.DB_NAME || 'Não definido (usando u609303672_virt)');
console.log('DB_PASS:', process.env.DB_PASSWORD ? 'Definida' : 'Não definida (usando padrão)');
console.log('------------------------------');

// Extend session type for TypeScript
declare module 'express-session' {
  interface SessionData {
    user_id: number;
    nivel_acesso: 'super_admin' | 'admin' | 'funcionario';
  }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'u609303672_virt',
  password: process.env.DB_PASSWORD || 'Virtude@2026',
  database: process.env.DB_NAME || 'u609303672_virt',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function initializeDatabase() {
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
    const [rows] = await connection.query('SELECT id FROM usuario WHERE email = ?', ['admin@admin']) as any[];
    if (rows.length === 0) {
      console.log('Default admin user not found. Creating...');
      await connection.query('INSERT INTO usuario (nome, email, senha, registro, funcao, nivel_acesso) VALUES (?, ?, ?, ?, ?, ?)', 
        ['Administrador', 'admin@admin', 'admin', '000', 'Admin', 'admin']);
      console.log('Default admin user created successfully.');
    } else {
      console.log('Default admin user already exists.');
    }
  } finally {
    connection.release();
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
    const { email, password } = req.body;
    const [rows] = await pool.query('SELECT * FROM usuario WHERE email = ? AND senha = ?', [email, password]) as any[];
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
