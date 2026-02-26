<?php
require_once __DIR__ . '/../../core/session.php';
require_once __DIR__ . '/../../core/db.php';

if (!Session::exists('user_id') || !Session::get('empresa_id')) {
    header('Location: ../../public/login.php');
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ../../public/saidas.php');
    exit();
}

$db = DB::getInstance();
$empresa_id = Session::get('empresa_id');
$usuario_id = Session::get('user_id');

// Dados do formulário
$produto_id = $_POST['produto_id'];
$tipo_saida = $_POST['tipo_saida'];
$quantidade = (int)$_POST['quantidade'];
$galpao_origem_id = $_POST['galpao_origem_id'];
$galpao_destino_id = ($tipo_saida === 'transferencia' && !empty($_POST['galpao_destino_id'])) ? $_POST['galpao_destino_id'] : null;

// Validação
if ($tipo_saida === 'transferencia' && $galpao_origem_id == $galpao_destino_id) {
    Session::flash('error_message', 'O galpão de destino não pode ser o mesmo que o de origem.');
    header('Location: ../../public/saida_form.php');
    exit();
}

// 1. Buscar informações do produto e do estoque de origem
$db->query("SELECT p.peso_unitario, e.quantidade as estoque_atual, e.valor_total, e.peso_total FROM produtos p JOIN estoque e ON p.id = e.produto_id WHERE p.id = ? AND e.galpao_id = ? AND p.empresa_id = ?", [$produto_id, $galpao_origem_id, $empresa_id]);
if ($db->count() == 0) {
    Session::flash('error_message', 'Estoque não encontrado para o produto no galpão de origem!');
    header('Location: ../../public/saida_form.php');
    exit();
}
$item_estoque = $db->first();

if ($quantidade > $item_estoque->estoque_atual) {
    Session::flash('error_message', 'Quantidade de saída maior que o estoque disponível.');
    header('Location: ../../public/saida_form.php');
    exit();
}

// Calcular valores proporcionais para a saída
$peso_saida = $item_estoque->peso_unitario * $quantidade;
$valor_medio_unitario = $item_estoque->valor_total / $item_estoque->estoque_atual;
$valor_saida = $valor_medio_unitario * $quantidade;

// 2. Registrar a movimentação de saída
$sql_mov = "INSERT INTO movimentacoes (empresa_id, produto_id, usuario_id, tipo_movimentacao, tipo_saida, galpao_origem_id, galpao_destino_id, quantidade, peso, valor_unitario) VALUES (?, ?, ?, 'saida', ?, ?, ?, ?, ?, ?)";
$params_mov = [$empresa_id, $produto_id, $usuario_id, $tipo_saida, $galpao_origem_id, $galpao_destino_id, $quantidade, $peso_saida, $valor_medio_unitario];
$db->query($sql_mov, $params_mov);

// 3. Deduzir do estoque de origem
$nova_qtd_origem = $item_estoque->estoque_atual - $quantidade;
$novo_valor_origem = $item_estoque->valor_total - $valor_saida;
$novo_peso_origem = $item_estoque->peso_total - $peso_saida;
$db->query("UPDATE estoque SET quantidade = ?, valor_total = ?, peso_total = ? WHERE produto_id = ? AND galpao_id = ?", [$nova_qtd_origem, $novo_valor_origem, $novo_peso_origem, $produto_id, $galpao_origem_id]);

// 4. Se for transferência, adicionar ao estoque de destino
if ($tipo_saida === 'transferencia') {
    $db->query("SELECT id, quantidade, valor_total, peso_total FROM estoque WHERE produto_id = ? AND galpao_id = ?", [$produto_id, $galpao_destino_id]);
    if ($db->count() > 0) {
        $estoque_destino = $db->first();
        $nova_qtd_destino = $estoque_destino->quantidade + $quantidade;
        $novo_valor_destino = $estoque_destino->valor_total + $valor_saida;
        $novo_peso_destino = $estoque_destino->peso_total + $peso_saida;
        $db->query("UPDATE estoque SET quantidade = ?, valor_total = ?, peso_total = ? WHERE id = ?", [$nova_qtd_destino, $novo_valor_destino, $novo_peso_destino, $estoque_destino->id]);
    } else {
        $db->query("INSERT INTO estoque (produto_id, galpao_id, quantidade, valor_total, peso_total) VALUES (?, ?, ?, ?, ?)", [$produto_id, $galpao_destino_id, $quantidade, $valor_saida, $peso_saida]);
    }
}

Session::flash('success_message', 'Saída de produto registrada com sucesso!');
header('Location: ../../public/saidas.php');
exit();
?>
