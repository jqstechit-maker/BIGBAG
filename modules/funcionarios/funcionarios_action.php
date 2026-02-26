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
    $email = trim($_POST['email']);
    $numero_registro = trim($_POST['numero_registro']);
    $funcao = trim($_POST['funcao']);
    $nivel_acesso = $_POST['nivel_acesso'];
    $senha = $_POST['senha'];

    if ($action === 'add') {
        $hashed_password = password_hash($senha, PASSWORD_DEFAULT);
        $sql = "INSERT INTO usuarios (empresa_id, nome, email, senha, numero_registro, funcao, nivel_acesso) VALUES (?, ?, ?, ?, ?, ?, ?)";
        $params = [$empresa_id, $nome, $email, $hashed_password, $numero_registro, $funcao, $nivel_acesso];
        $db->query($sql, $params);
        Session::flash('success_message', 'Funcionário cadastrado com sucesso!');

    } elseif ($action === 'edit') {
        $id = $_POST['id'];
        if (!empty($senha)) {
            $hashed_password = password_hash($senha, PASSWORD_DEFAULT);
            $sql = "UPDATE usuarios SET nome = ?, email = ?, numero_registro = ?, funcao = ?, nivel_acesso = ?, senha = ? WHERE id = ? AND empresa_id = ?";
            $params = [$nome, $email, $numero_registro, $funcao, $nivel_acesso, $hashed_password, $id, $empresa_id];
        } else {
            $sql = "UPDATE usuarios SET nome = ?, email = ?, numero_registro = ?, funcao = ?, nivel_acesso = ? WHERE id = ? AND empresa_id = ?";
            $params = [$nome, $email, $numero_registro, $funcao, $nivel_acesso, $id, $empresa_id];
        }
        $db->query($sql, $params);
        Session::flash('success_message', 'Funcionário atualizado com sucesso!');
    }

    header('Location: ../../public/funcionarios.php');
    exit();
}

if (isset($_GET['action']) && $_GET['action'] === 'delete') {
    $id = $_GET['id'];
    $db->query("DELETE FROM usuarios WHERE id = ? AND empresa_id = ?", [$id, $empresa_id]);
    Session::flash('success_message', 'Funcionário excluído com sucesso!');
    header('Location: ../../public/funcionarios.php');
    exit();
}

header('Location: ../../public/funcionarios.php');
exit();
?>
