<?php
// Ativar erros para diagnóstico
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../core/session.php';
require_once __DIR__ . '/../../core/db.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $db = DB::getInstance();

    $email = trim($_POST['email']);
    $senha = $_POST['senha'];

    if (empty($email) || empty($senha)) {
        Session::flash('login_error', 'Por favor, preencha todos os campos.');
        header('Location: ' . BASE_URL . '/login.php');
        exit();
    }

    try {
        // Buscar usuário pelo email
        $db->query("SELECT * FROM usuarios WHERE email = ?", [$email]);

        if ($db->count() > 0) {
            $user = $db->first();

            // Verificar a senha
            if (password_verify($senha, $user->senha)) {
                // Login bem-sucedido, criar sessão
                Session::set('user_id', $user->id);
                Session::set('user_nome', $user->nome);
                Session::set('user_nivel', $user->nivel_acesso);
                Session::set('empresa_id', $user->empresa_id);

                header('Location: ' . BASE_URL . '/dashboard.php');
                exit();
            } else {
                Session::flash('login_error', 'Senha incorreta.');
                header('Location: ' . BASE_URL . '/login.php');
                exit();
            }
        } else {
            Session::flash('login_error', 'Usuário não encontrado.');
            header('Location: ' . BASE_URL . '/login.php');
            exit();
        }
    } catch (Exception $e) {
        die("Erro no processamento: " . $e->getMessage());
    }
}

header('Location: ' . BASE_URL . '/login.php');
exit();
?>
