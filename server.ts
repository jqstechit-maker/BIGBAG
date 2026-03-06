import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors({
    origin: true,
    credentials: true
  }));
  app.use(express.json());
  
  // Session configuration for AI Studio (iframe compatibility)
  app.set('trust proxy', 1);
  app.use(session({
    secret: 'virtude-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,
      sameSite: 'none',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // --- Mock Database (Fallback for Preview) ---
  // In a real scenario, this would connect to MySQL
  let db = {
    produtos: [
      { id: 1, codigo: 'VT-0048', descricao: 'BigBag 90x90x120', tipo: 'Fardo', fornecedorId: 1, galpaoId: 1, estoque: 150, min: 50, pesoUnit: 1.2, valorUnit: 45.50 },
      { id: 2, codigo: 'VT-0052', descricao: 'BigBag 100x100x140', tipo: 'Fardo', fornecedorId: 2, galpaoId: 1, estoque: 80, min: 100, pesoUnit: 1.5, valorUnit: 52.00 },
      { id: 3, codigo: 'VT-0089', descricao: 'Bobina Plástica 1200mm', tipo: 'Bobina', fornecedorId: 1, galpaoId: 2, estoque: 25, min: 10, pesoUnit: 45.0, valorUnit: 380.00 },
    ],
    fornecedores: [
      { id: 1, nome: 'Plásticos S.A', telefone: '(11) 9999-8888', email: 'contato@plasticos.com' },
      { id: 2, nome: 'Têxtil Brasil', telefone: '(21) 8888-7777', email: 'vendas@textil.com.br' },
    ],
    galpoes: [
      { id: 1, nome: 'Galpão A', descricao: 'Armazenamento de Leves' },
      { id: 2, nome: 'Galpão B', descricao: 'Produtos Pesados' },
    ],
    funcionarios: [
      { id: 1, nome: 'João Silva', email: 'admin@admin.com', registro: '001', funcao: 'Almoxarife', nivel: 'admin', senha: 'admin' },
      { id: 2, nome: 'Maria Souza', email: 'maria@empresa.com', registro: '002', funcao: 'Operador', nivel: 'funcionario', senha: '123' },
    ],
    movimentacoes: [
      { id: 1, data: '01/03/2026, 10:00:00', codigo: 'VT-0048', produto: 'BigBag 90x90x120', fornecedor: 'Plásticos S.A', tipo: 'entrada', qtd: 100, peso: 120, nf: '12345', responsavel: 'João Silva', valorUnit: 45.50, valorTotal: 4550.00, produtoId: 1 },
      { id: 2, data: '02/03/2026, 14:30:00', codigo: 'VT-0052', produto: 'BigBag 100x100x140', fornecedor: 'Têxtil Brasil', tipo: 'saida', qtd: 20, peso: 30, nf: '54321', responsavel: 'Maria Souza', valorUnit: 52.00, valorTotal: 1040.00, produtoId: 2 },
      { id: 3, data: '04/03/2026, 11:00:00', codigo: 'VT-0048', produto: 'BigBag 90x90x120', fornecedor: 'Plásticos S.A', tipo: 'devolucao', qtd: 5, peso: 6, nf: '12345', responsavel: 'João Silva', valorUnit: 45.50, valorTotal: 227.50, produtoId: 1 },
    ],
    movimentacoes_internas: [
      { id: 1, data: '03/03/2026, 09:15:00', codigo: 'VT-0048', produto: 'BigBag 90x90x120', tipo: 'Produção', qtd: 10, peso: 12, responsavel: 'João Silva', destino: 'Linha 1', valorUnit: 45.50, valorTotal: 455.00, produtoId: 1 },
    ]
  };

  // --- Auth Routes ---
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.funcionarios.find(f => (f.nome === username || f.email === username) && f.senha === password);
    
    if (user) {
      (req.session as any).user = user;
      res.json({ success: true, user });
    } else {
      res.status(401).json({ success: false, message: "Credenciais inválidas" });
    }
  });

  app.get("/api/me", (req, res) => {
    if ((req.session as any).user) {
      res.json({ success: true, user: (req.session as any).user });
    } else {
      res.status(401).json({ success: false });
    }
  });

  app.post("/api/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  // --- Generic CRUD Factory ---
  const setupCRUD = (entity: keyof typeof db) => {
    app.get(`/api/${entity}`, (req, res) => {
      res.json(db[entity]);
    });

    app.post(`/api/${entity}`, (req, res) => {
      const newItem = { ...req.body, id: Date.now() };
      (db[entity] as any[]).push(newItem);
      res.json(newItem);
    });

    app.put(`/api/${entity}/:id`, (req, res) => {
      const id = parseInt(req.params.id);
      const index = (db[entity] as any[]).findIndex(item => item.id === id);
      if (index !== -1) {
        db[entity][index] = { ...db[entity][index], ...req.body };
        res.json(db[entity][index]);
      } else {
        res.status(404).json({ error: "Não encontrado" });
      }
    });

    app.delete(`/api/${entity}/:id`, (req, res) => {
      const id = parseInt(req.params.id);
      db[entity] = (db[entity] as any[]).filter(item => item.id !== id) as any;
      res.json({ success: true });
    });
  };

  setupCRUD("produtos");
  setupCRUD("fornecedores");
  setupCRUD("galpoes");
  setupCRUD("funcionarios");
  setupCRUD("movimentacoes");
  setupCRUD("movimentacoes_internas");

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
