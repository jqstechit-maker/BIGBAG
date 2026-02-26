<?php
require_once __DIR__ . '/../layout/header.php';
require_once __DIR__ . '/../layout/sidebar.php';
require_once __DIR__ . '/../core/db.php';

if (!Session::exists('user_id')) {
    header('Location: login.php');
    exit();
}

$db = DB::getInstance();
$empresa_id = Session::get('empresa_id');

// Busca produtos com joins para obter nomes de fornecedor e galpão
$db->query("SELECT p.*, f.nome_empresa as fornecedor_nome, g.nome as galpao_nome FROM produtos p LEFT JOIN fornecedores f ON p.fornecedor_id = f.id LEFT JOIN galpoes g ON p.galpao_id = g.id WHERE p.empresa_id = ? ORDER BY p.descricao ASC", [$empresa_id]);
$produtos = $db->results();

$success_message = Session::flash('success_message');
?>

<main class="flex-1 p-6 bg-gray-100">
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-gray-800">Cadastro de Produtos</h1>
        <a href="produto_form.php" class="bg-erp-blue-600 hover:bg-erp-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors">
            <i class="fas fa-plus mr-2"></i> Adicionar Produto
        </a>
    </div>

    <?php if ($success_message): ?>
        <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span class="block sm:inline"><?php echo $success_message; ?></span>
        </div>
    <?php endif; ?>

    <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="overflow-x-auto">
            <table class="min-w-full bg-white">
                <thead class="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                    <tr>
                        <th class="py-3 px-6 text-left">Código</th>
                        <th class="py-3 px-6 text-left">Descrição</th>
                        <th class="py-3 px-6 text-left">Tipo</th>
                        <th class="py-3 px-6 text-left">Fornecedor</th>
                        <th class="py-3 px-6 text-left">Galpão</th>
                        <th class="py-3 px-6 text-center">Ações</th>
                    </tr>
                </thead>
                <tbody class="text-gray-600 text-sm font-light">
                    <?php if (count($produtos) > 0): ?>
                        <?php foreach ($produtos as $produto): ?>
                            <tr class="border-b border-gray-200 hover:bg-gray-100">
                                <td class="py-3 px-6 text-left whitespace-nowrap"><?php echo htmlspecialchars($produto->codigo); ?></td>
                                <td class="py-3 px-6 text-left"><?php echo htmlspecialchars($produto->descricao); ?></td>
                                <td class="py-3 px-6 text-left"><?php echo htmlspecialchars($produto->tipo_produto); ?></td>
                                <td class="py-3 px-6 text-left"><?php echo htmlspecialchars($produto->fornecedor_nome ?? 'N/A'); ?></td>
                                <td class="py-3 px-6 text-left"><?php echo htmlspecialchars($produto->galpao_nome); ?></td>
                                <td class="py-3 px-6 text-center">
                                    <div class="flex item-center justify-center">
                                        <a href="produto_form.php?id=<?php echo $produto->id; ?>" class="w-8 h-8 flex items-center justify-center rounded-full bg-blue-200 text-blue-600 hover:bg-blue-300 mr-2 transform hover:scale-110 transition-transform">
                                            <i class="fas fa-pencil-alt"></i>
                                        </a>
                                        <a href="../modules/produtos/produtos_action.php?action=delete&id=<?php echo $produto->id; ?>" onclick="return confirm('Tem certeza que deseja excluir este produto?');" class="w-8 h-8 flex items-center justify-center rounded-full bg-red-200 text-red-600 hover:bg-red-300 transform hover:scale-110 transition-transform">
                                            <i class="fas fa-trash-alt"></i>
                                        </a>
                                    </div>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <tr>
                            <td colspan="6" class="text-center py-4">Nenhum produto cadastrado.</td>
                        </tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
</main>

<?php require_once __DIR__ . '/../layout/footer.php'; ?>
