<?php
require_once __DIR__ . '/../../core/session.php';
require_once __DIR__ . '/../../core/db.php';

if (!Session::exists('user_id') || !Session::get('empresa_id')) {
    header('Location: ../../public/login.php');
    exit();
}

$db = DB::getInstance();
$empresa_id = Session::get('empresa_id');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'];
    
    $nome_empresa = trim($_POST['nome_empresa']);
    $telefone = trim($_POST['telefone']);
    $email = trim($_POST['email']);
    $endereco = trim($_POST['endereco']);

    if ($action === 'add') {
        $sql = "INSERT INTO fornecedores (empresa_id, nome_empresa, telefone, email, endereco) VALUES (?, ?, ?, ?, ?)";
        $params = [$empresa_id, $nome_empresa, $telefone, $email, $endereco];
        $db->query($sql, $params);
        Session::flash('success_message', 'Fornecedor cadastrado com sucesso!');

    } elseif ($action === 'edit') {
        $id = $_POST['id'];
        $sql = "UPDATE fornecedores SET nome_empresa = ?, telefone = ?, email = ?, endereco = ? WHERE id = ? AND empresa_id = ?";
        $params = [$nome_empresa, $telefone, $email, $endereco, $id, $empresa_id];
        $db->query($sql, $params);
        Session::flash('success_message', 'Fornecedor atualizado com sucesso!');
    }

    header('Location: ../../public/fornecedores.php');
    exit();
}

if (isset($_GET['action']) && $_GET['action'] === 'delete') {
    $id = $_GET['id'];
    $db->query("DELETE FROM fornecedores WHERE id = ? AND empresa_id = ?", [$id, $empresa_id]);
    Session::flash('success_message', 'Fornecedor excluído com sucesso!');
    header('Location: ../../public/fornecedores.php');
    exit();
}

header('Location: ../../public/fornecedores.php');
exit();
?>
