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
        p.descricao as produto_nome,
        p.tipo_produto,
        p.estoque_minimo,
        f.nome_empresa as fornecedor_nome,
        g.nome as galpao_nome,
        e.quantidade as estoque_atual,
        e.peso_total,
        e.valor_total,
        (SELECT SUM(m.quantidade) FROM movimentacoes m WHERE m.produto_id = p.id AND m.tipo_movimentacao = 'entrada') as total_entradas,
        (SELECT SUM(m.quantidade) FROM movimentacoes m WHERE m.produto_id = p.id AND m.tipo_movimentacao = 'saida') as total_saidas
    FROM estoque e
    JOIN produtos p ON e.produto_id = p.id
    JOIN galpoes g ON e.galpao_id = g.id
    LEFT JOIN fornecedores f ON p.fornecedor_id = f.id
    WHERE p.empresa_id = ?
    ORDER BY p.descricao ASC
";

$db->query($sql, [$empresa_id]);
$estoque_items = $db->results();

function getStatusEstoque($atual, $minimo) {
    if ($atual <= 0) {
        return ['label' => 'Em Falta', 'class' => 'bg-red-500 text-white'];
    }
    if ($atual <= $minimo) {
        return ['label' => 'Baixo', 'class' => 'bg-yellow-500 text-white'];
    }
    if ($atual > $minimo * 2) { // Exemplo de 'Cheio'
        return ['label' => 'Cheio', 'class' => 'bg-blue-500 text-white'];
    }
    return ['label' => 'Normal', 'class' => 'bg-green-500 text-white'];
}

?>

<main class="flex-1 p-6 bg-gray-100">
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-gray-800">Controle de Estoque</h1>
    </div>

    <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="overflow-x-auto">
            <table class="min-w-full bg-white">
                <thead class="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                    <tr>
                        <th class="py-3 px-6 text-left">Produto</th>
                        <th class="py-3 px-6 text-left">Tipo</th>
                        <th class="py-3 px-6 text-left">Fornecedor</th>
                        <th class="py-3 px-6 text-left">Galpão</th>
                        <th class="py-3 px-6 text-center">Estoque Atual</th>
                        <th class="py-3 px-6 text-center">Entradas</th>
                        <th class="py-3 px-6 text-center">Saídas</th>
                        <th class="py-3 px-6 text-center">Peso Total (kg)</th>
                        <th class="py-3 px-6 text-center">Valor Total (R$)</th>
                        <th class="py-3 px-6 text-center">Status</th>
                    </tr>
                </thead>
                <tbody class="text-gray-600 text-sm font-light">
                    <?php if (count($estoque_items) > 0): ?>
                        <?php foreach ($estoque_items as $item): ?>
                            <?php $status = getStatusEstoque($item->estoque_atual, $item->estoque_minimo); ?>
                            <tr class="border-b border-gray-200 hover:bg-gray-100">
                                <td class="py-3 px-6 text-left font-medium"><?php echo htmlspecialchars($item->produto_nome); ?></td>
                                <td class="py-3 px-6 text-left"><?php echo htmlspecialchars($item->tipo_produto); ?></td>
                                <td class="py-3 px-6 text-left"><?php echo htmlspecialchars($item->fornecedor_nome ?? 'N/A'); ?></td>
                                <td class="py-3 px-6 text-left"><?php echo htmlspecialchars($item->galpao_nome); ?></td>
                                <td class="py-3 px-6 text-center font-bold text-lg"><?php echo htmlspecialchars($item->estoque_atual); ?></td>
                                <td class="py-3 px-6 text-center text-green-600"><?php echo htmlspecialchars($item->total_entradas ?? 0); ?></td>
                                <td class="py-3 px-6 text-center text-red-600"><?php echo htmlspecialchars($item->total_saidas ?? 0); ?></td>
                                <td class="py-3 px-6 text-center"><?php echo number_format($item->peso_total, 3, ',', '.'); ?></td>
                                <td class="py-3 px-6 text-center"><?php echo number_format($item->valor_total, 2, ',', '.'); ?></td>
                                <td class="py-3 px-6 text-center">
                                    <span class="px-3 py-1 rounded-full text-xs <?php echo $status['class']; ?>">
                                        <?php echo $status['label']; ?>
                                    </span>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <tr>
                            <td colspan="10" class="text-center py-4">Nenhum item em estoque.</td>
                        </tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
</main>

<?php require_once __DIR__ . '/../layout/footer.php'; ?>
