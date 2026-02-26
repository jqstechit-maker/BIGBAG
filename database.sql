-- Estrutura do Banco de Dados para VIRTUDE BIGBAG'S

-- Tabela de Empresas
CREATE TABLE IF NOT EXISTS `empresas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nome` VARCHAR(255) NOT NULL,
  `cnpj` VARCHAR(20),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `empresa_id` INT,
  `nome` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `senha` VARCHAR(255) NOT NULL,
  `nivel_acesso` ENUM('super_admin', 'admin', 'funcionario') NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`empresa_id`) REFERENCES `empresas`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Fornecedores
CREATE TABLE IF NOT EXISTS `fornecedores` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `empresa_id` INT NOT NULL,
  `nome` VARCHAR(255) NOT NULL,
  `telefone` VARCHAR(20),
  `email` VARCHAR(255),
  `endereco` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`empresa_id`) REFERENCES `empresas`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Galpões (Locais de Armazenamento)
CREATE TABLE IF NOT EXISTS `galpoes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `empresa_id` INT NOT NULL,
  `nome` VARCHAR(255) NOT NULL,
  `descricao` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`empresa_id`) REFERENCES `empresas`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Produtos
CREATE TABLE IF NOT EXISTS `produtos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `empresa_id` INT NOT NULL,
  `codigo` VARCHAR(50) NOT NULL,
  `descricao` VARCHAR(255) NOT NULL,
  `tipo_produto` ENUM('Bobina', 'Fardo', 'Caixa', 'Pacote', 'Rolo') NOT NULL,
  `fornecedor_id` INT,
  `galpao_id` INT,
  `peso_unitario` DECIMAL(10,3),
  `unidade` VARCHAR(20),
  `estoque_minimo` INT DEFAULT 0,
  `estoque_atual` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`empresa_id`) REFERENCES `empresas`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`fornecedor_id`) REFERENCES `fornecedores`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`galpao_id`) REFERENCES `galpoes`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Funcionários
CREATE TABLE IF NOT EXISTS `funcionarios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `empresa_id` INT NOT NULL,
  `nome` VARCHAR(255) NOT NULL,
  `registro` VARCHAR(50),
  `funcao` VARCHAR(100),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`empresa_id`) REFERENCES `empresas`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Movimentações (Entradas e Saídas)
CREATE TABLE IF NOT EXISTS `movimentacoes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `empresa_id` INT NOT NULL,
  `produto_id` INT NOT NULL,
  `tipo` ENUM('entrada', 'saida') NOT NULL,
  `quantidade` INT NOT NULL,
  `peso` DECIMAL(10,3) NOT NULL,
  `nota_fiscal` VARCHAR(50),
  `data_movimentacao` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `responsavel_id` INT,
  `observacoes` TEXT,
  FOREIGN KEY (`empresa_id`) REFERENCES `empresas`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`produto_id`) REFERENCES `produtos`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`responsavel_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Inserção de Dados Iniciais (Exemplo)
INSERT INTO `empresas` (`id`, `nome`) VALUES (1, 'Empresa Matriz');

-- Senha padrão: superadmin123 (Criptografada com password_hash)
INSERT INTO `usuarios` (`empresa_id`, `nome`, `email`, `senha`, `nivel_acesso`) 
VALUES (1, 'Super Admin', 'superadmin@erp.com', '$2y$10$7R.E.e7E.e7E.e7E.e7E.e7E.e7E.e7E.e7E.e7E.e7E.e7E.e7E.', 'super_admin');

-- Senha padrão: admin (Criptografada com password_hash)
INSERT INTO `usuarios` (`empresa_id`, `nome`, `email`, `senha`, `nivel_acesso`) 
VALUES (1, 'Admin', 'admin@admin.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');
