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

$sql = "
    SELECT 
        m.*, 
        p.descricao as produto_nome, 
        u.nome as responsavel_nome,
        go.nome as galpao_origem_nome,
        gd.nome as galpao_destino_nome
    FROM movimentacoes m
    JOIN produtos p ON m.produto_id = p.id
    JOIN usuarios u ON m.usuario_id = u.id
    JOIN galpoes go ON m.galpao_origem_id = go.id
    LEFT JOIN galpoes gd ON m.galpao_destino_id = gd.id
    WHERE m.empresa_id = ? AND m.tipo_movimentacao = 'saida'
    ORDER BY m.data_movimentacao DESC
";
$db->query($sql, [$empresa_id]);
$saidas = $db->results();

$success_message = Session::flash('success_message');
?>

<main class="flex-1 p-6 bg-gray-100">
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-gray-800">Saída de Produtos</h1>
        <a href="saida_form.php" class="bg-erp-blue-600 hover:bg-erp-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors">
            <i class="fas fa-plus mr-2"></i> Registrar Saída
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
                        <th class="py-3 px-6 text-left">Data</th>
                        <th class="py-3 px-6 text-left">Produto</th>
                        <th class="py-3 px-6 text-left">Tipo de Saída</th>
                        <th class="py-3 px-6 text-center">Quantidade</th>
                        <th class="py-3 px-6 text-left">Galpão Origem</th>
                        <th class="py-3 px-6 text-left">Galpão Destino</th>
                        <th class="py-3 px-6 text-left">Responsável</th>
                    </tr>
                </thead>
                <tbody class="text-gray-600 text-sm font-light">
                    <?php if (count($saidas) > 0): ?>
                        <?php foreach ($saidas as $saida): ?>
                            <tr class="border-b border-gray-200 hover:bg-gray-100">
                                <td class="py-3 px-6 text-left"><?php echo date('d/m/Y H:i', strtotime($saida->data_movimentacao)); ?></td>
                                <td class="py-3 px-6 text-left"><?php echo htmlspecialchars($saida->produto_nome); ?></td>
                                <td class="py-3 px-6 text-left capitalize"><?php echo htmlspecialchars($saida->tipo_saida); ?></td>
                                <td class="py-3 px-6 text-center"><?php echo htmlspecialchars($saida->quantidade); ?></td>
                                <td class="py-3 px-6 text-left"><?php echo htmlspecialchars($saida->galpao_origem_nome); ?></td>
                                <td class="py-3 px-6 text-left"><?php echo htmlspecialchars($saida->galpao_destino_nome ?? 'N/A'); ?></td>
                                <td class="py-3 px-6 text-left"><?php echo htmlspecialchars($saida->responsavel_nome); ?></td>
                            </tr>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <tr>
                            <td colspan="7" class="text-center py-4">Nenhuma saída registrada.</td>
                        </tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
</main>

<?php require_once __DIR__ . '/../layout/footer.php'; ?>
