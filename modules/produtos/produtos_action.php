<?php
require_once __DIR__ . '/../../core/session.php';
require_once __DIR__ . '/../../core/db.php';

if (!Session::exists('user_id') || !Session::get('empresa_id')) {
    // Se não estiver logado ou não tiver empresa, não pode fazer nada aqui
    header('Location: ../../public/login.php');
    exit();
}

$db = DB::getInstance();
$empresa_id = Session::get('empresa_id');

// Ação de Adicionar ou Editar
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'];
    
    // Dados do formulário
    $codigo = trim($_POST['codigo']);
    $descricao = trim($_POST['descricao']);
    $tipo_produto = $_POST['tipo_produto'];
    $fornecedor_id = !empty($_POST['fornecedor_id']) ? $_POST['fornecedor_id'] : null;
    $galpao_id = $_POST['galpao_id'];
    $peso_unitario = $_POST['peso_unitario'];
    $unidade = trim($_POST['unidade']);
    $estoque_minimo = $_POST['estoque_minimo'];

    if ($action === 'add') {
        // Inserir novo produto
        $sql = "INSERT INTO produtos (empresa_id, codigo, descricao, tipo_produto, fornecedor_id, galpao_id, peso_unitario, unidade, estoque_minimo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $params = [$empresa_id, $codigo, $descricao, $tipo_produto, $fornecedor_id, $galpao_id, $peso_unitario, $unidade, $estoque_minimo];
        
        $db->query($sql, $params);

        if (!$db->error()) {
            Session::flash('success_message', 'Produto cadastrado com sucesso!');
        } else {
            Session::flash('error_message', 'Erro ao cadastrar o produto.');
        }

    } elseif ($action === 'edit') {
        // Atualizar produto existente
        $id = $_POST['id'];
        $sql = "UPDATE produtos SET codigo = ?, descricao = ?, tipo_produto = ?, fornecedor_id = ?, galpao_id = ?, peso_unitario = ?, unidade = ?, estoque_minimo = ? WHERE id = ? AND empresa_id = ?";
        $params = [$codigo, $descricao, $tipo_produto, $fornecedor_id, $galpao_id, $peso_unitario, $unidade, $estoque_minimo, $id, $empresa_id];

        $db->query($sql, $params);

        if (!$db->error()) {
            Session::flash('success_message', 'Produto atualizado com sucesso!');
        } else {
            Session::flash('error_message', 'Erro ao atualizar o produto.');
        }
    }

    header('Location: ../../public/produtos.php');
    exit();
}

// Ação de Excluir
if (isset($_GET['action']) && $_GET['action'] === 'delete') {
    $id = $_GET['id'];
    
    // Deletar o produto
    // O ON DELETE CASCADE no banco de dados cuidará de remover registros relacionados em 'estoque' e 'movimentacoes'
    $db->query("DELETE FROM produtos WHERE id = ? AND empresa_id = ?", [$id, $empresa_id]);

    if (!$db->error()) {
        Session::flash('success_message', 'Produto excluído com sucesso!');
    } else {
        Session::flash('error_message', 'Erro ao excluir o produto.');
    }

    header('Location: ../../public/produtos.php');
    exit();
}

// Redireciona se nenhuma ação válida for encontrada
header('Location: ../../public/produtos.php');
exit();

?>
