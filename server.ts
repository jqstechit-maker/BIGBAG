import express from 'express';
import { createServer as createViteServer } from 'vite';
import mysql from 'mysql2/promise';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

console.log('--- Environment Variables Check ---');
console.log('DB_HOST from env:', process.env.DB_HOST);
console.log('DB_USER from env:', process.env.DB_USER);
console.log('DB_NAME from env:', process.env.DB_NAME);
console.log('DB_PASSWORD from env:', process.env.DB_PASSWORD ? 'Loaded' : 'NOT LOADED');
console.log('---------------------------------');

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// MySQL Connection Pool
console.log('Attempting to connect to database with:');
console.log('Host:', process.env.DB_HOST || 'localhost');
console.log('User:', process.env.DB_USER || 'root');
console.log('Database:', process.env.DB_NAME || 'estoque');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'estoque',
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
      CREATE TABLE IF NOT EXISTS funcionarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        senha VARCHAR(255) NOT NULL,
        registro VARCHAR(255),
        funcao VARCHAR(255),
        nivel ENUM('admin', 'funcionario') NOT NULL
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
    const [rows] = await connection.query('SELECT id FROM funcionarios WHERE email = ?', ['admin@admin']) as any[];
    if (rows.length === 0) {
      console.log('Default admin user not found. Creating...');
      await connection.query('INSERT INTO funcionarios (nome, email, senha, registro, funcao, nivel) VALUES (?, ?, ?, ?, ?, ?)', 
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
  const PORT = process.env.PORT || 3000;

  app.use(cors());
  app.use(express.json());

  // Health check for Hostinger
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', database: 'connected' });
  });

  // Auth
  app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const [rows] = await pool.query('SELECT * FROM funcionarios WHERE email = ? AND senha = ?', [email, password]) as any[];
    if (rows.length > 0) {
      const user = rows[0];
      res.json({ success: true, user: { id: user.id, nome: user.nome, email: user.email, nivel: user.nivel } });
    } else {
      res.status(401).json({ success: false, message: 'Credenciais inválidas' });
    }
  });

  // Produtos
  app.get('/api/produtos', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM produtos');
    res.json(rows);
  });

  app.post('/api/produtos', async (req, res) => {
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
  
  app.put('/api/produtos/:id', async (req, res) => {
    const { id } = req.params;
    const { codigo, descricao, tipo, fornecedorId, galpaoId, min, pesoUnit, valorUnit } = req.body;
    await pool.query(
      'UPDATE produtos SET codigo = ?, descricao = ?, tipo = ?, fornecedorId = ?, galpaoId = ?, min = ?, pesoUnit = ?, valorUnit = ? WHERE id = ?',
      [codigo, descricao, tipo, fornecedorId, galpaoId, min, pesoUnit, valorUnit, id]
    );
    res.json({ success: true });
  });

  app.delete('/api/produtos/:id', async (req, res) => {
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
    app.post(`/api/${tableName}`, async (req, res) => {
      const values = columns.map(col => req.body[col]);
      const [result] = await pool.query(`INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`, values) as any[];
      res.json({ id: result.insertId });
    });
    app.put(`/api/${tableName}/:id`, async (req, res) => {
      const values = columns.map(col => req.body[col]);
      await pool.query(`UPDATE ${tableName} SET ${columns.map(col => `${col} = ?`).join(', ')} WHERE id = ?`, [...values, req.params.id]);
      res.json({ success: true });
    });
    app.delete(`/api/${tableName}/:id`, async (req, res) => {
      await pool.query(`DELETE FROM ${tableName} WHERE id = ?`, [req.params.id]);
      res.json({ success: true });
    });
  };

  createCrudRoutes('fornecedores', ['nome', 'telefone', 'email']);
  createCrudRoutes('galpoes', ['nome', 'descricao']);
  
  // Special handling for funcionarios due to password
  app.get('/api/funcionarios', async (req, res) => {
    const [rows] = await pool.query('SELECT id, nome, email, registro, funcao, nivel FROM funcionarios');
    res.json(rows);
  });
  app.post('/api/funcionarios', async (req, res) => {
    const { nome, email, senha, registro, funcao, nivel } = req.body;
    const [result] = await pool.query('INSERT INTO funcionarios (nome, email, senha, registro, funcao, nivel) VALUES (?, ?, ?, ?, ?, ?)', [nome, email, senha, registro, funcao, nivel]) as any[];
    res.json({ id: result.insertId });
  });
  app.put('/api/funcionarios/:id', async (req, res) => {
    const { nome, email, senha, registro, funcao, nivel } = req.body;
    if (senha) {
      await pool.query('UPDATE funcionarios SET nome = ?, email = ?, senha = ?, registro = ?, funcao = ?, nivel = ? WHERE id = ?', [nome, email, senha, registro, funcao, nivel, req.params.id]);
    } else {
      await pool.query('UPDATE funcionarios SET nome = ?, email = ?, registro = ?, funcao = ?, nivel = ? WHERE id = ?', [nome, email, registro, funcao, nivel, req.params.id]);
    }
    res.json({ success: true });
  });
  app.delete('/api/funcionarios/:id', async (req, res) => {
    await pool.query('DELETE FROM funcionarios WHERE id = ?', [req.params.id]);
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
