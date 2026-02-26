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
    
    $nome = trim($_POST['nome']);
    $descricao = trim($_POST['descricao']);

    if ($action === 'add') {
        $sql = "INSERT INTO galpoes (empresa_id, nome, descricao) VALUES (?, ?, ?)";
        $params = [$empresa_id, $nome, $descricao];
        $db->query($sql, $params);
        Session::flash('success_message', 'Galpão cadastrado com sucesso!');

    } elseif ($action === 'edit') {
        $id = $_POST['id'];
        $sql = "UPDATE galpoes SET nome = ?, descricao = ? WHERE id = ? AND empresa_id = ?";
        $params = [$nome, $descricao, $id, $empresa_id];
        $db->query($sql, $params);
        Session::flash('success_message', 'Galpão atualizado com sucesso!');
    }

    header('Location: ../../public/galpoes.php');
    exit();
}

if (isset($_GET['action']) && $_GET['action'] === 'delete') {
    $id = $_GET['id'];
    $db->query("DELETE FROM galpoes WHERE id = ? AND empresa_id = ?", [$id, $empresa_id]);
    Session::flash('success_message', 'Galpão excluído com sucesso!');
    header('Location: ../../public/galpoes.php');
    exit();
}

header('Location: ../../public/galpoes.php');
exit();
?>
