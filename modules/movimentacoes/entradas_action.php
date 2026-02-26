<?php
require_once __DIR__ . '/../../core/session.php';
require_once __DIR__ . '/../../core/db.php';

if (!Session::exists('user_id') || !Session::get('empresa_id')) {
    header('Location: ../../public/login.php');
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ../../public/entradas.php');
    exit();
}

$db = DB::getInstance();
$empresa_id = Session::get('empresa_id');
$usuario_id = Session::get('user_id');

// Dados do formulário
$produto_id = $_POST['produto_id'];
$quantidade = (int)$_POST['quantidade'];
$valor_unitario = (float)$_POST['valor_unitario'];
$nota_fiscal = trim($_POST['nota_fiscal']);

// 1. Buscar informações do produto (galpão e peso unitário)
$db->query("SELECT galpao_id, peso_unitario FROM produtos WHERE id = ? AND empresa_id = ?", [$produto_id, $empresa_id]);
if ($db->count() == 0) {
    Session::flash('error_message', 'Produto não encontrado!');
    header('Location: ../../public/entrada_form.php');
    exit();
}
$produto = $db->first();
$galpao_id = $produto->galpao_id;
$peso_total = $produto->peso_unitario * $quantidade;
$valor_total = $valor_unitario * $quantidade;

// 2. Registrar a movimentação de entrada
$sql_mov = "INSERT INTO movimentacoes (empresa_id, produto_id, usuario_id, tipo_movimentacao, galpao_origem_id, quantidade, peso, valor_unitario, nota_fiscal) VALUES (?, ?, ?, 'entrada', ?, ?, ?, ?, ?)";
$params_mov = [$empresa_id, $produto_id, $usuario_id, $galpao_id, $quantidade, $peso_total, $valor_unitario, $nota_fiscal];
$db->query($sql_mov, $params_mov);

if ($db->error()) {
    Session::flash('error_message', 'Erro ao registrar a movimentação.');
    header('Location: ../../public/entrada_form.php');
    exit();
}

// 3. Atualizar o estoque
// Verifica se já existe um registro de estoque para este produto neste galpão
$db->query("SELECT id, quantidade, valor_total, peso_total FROM estoque WHERE produto_id = ? AND galpao_id = ?", [$produto_id, $galpao_id]);

if ($db->count() > 0) {
    // Se existe, atualiza (incrementa)
    $estoque = $db->first();
    $nova_qtd = $estoque->quantidade + $quantidade;
    $novo_valor = $estoque->valor_total + $valor_total;
    $novo_peso = $estoque->peso_total + $peso_total;
    
    $sql_est = "UPDATE estoque SET quantidade = ?, valor_total = ?, peso_total = ? WHERE id = ?";
    $params_est = [$nova_qtd, $novo_valor, $novo_peso, $estoque->id];
} else {
    // Se não existe, cria um novo registro
    $sql_est = "INSERT INTO estoque (produto_id, galpao_id, quantidade, valor_total, peso_total) VALUES (?, ?, ?, ?, ?)";
    $params_est = [$produto_id, $galpao_id, $quantidade, $valor_total, $peso_total];
}

$db->query($sql_est, $params_est);

if ($db->error()) {
    // Idealmente, aqui deveria haver um rollback da transação
    Session::flash('error_message', 'Erro ao atualizar o estoque.');
    header('Location: ../../public/entrada_form.php');
    exit();
}

Session::flash('success_message', 'Entrada de produto registrada com sucesso!');
header('Location: ../../public/entradas.php');
exit();
?>
