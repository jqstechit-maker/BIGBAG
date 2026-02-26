<?php
require_once __DIR__ . '/../core/session.php';

// Se o usuário já está logado, redireciona para o dashboard
if (Session::exists('user_id')) {
    header('Location: dashboard.php');
    exit();
}

$error = Session::flash('login_error');

?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - <?php echo SITE_NAME; ?></title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'erp-blue': {
                            '500': '#3b82f6', // blue-500
                            '600': '#2563eb', // blue-600
                            '700': '#1d4ed8', // blue-700
                        }
                    }
                }
            }
        }
    </script>
</head>
<body class="bg-gray-100 flex items-center justify-center min-h-screen">

    <div class="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div class="text-center">
            <h1 class="text-3xl font-bold text-gray-800"><?php echo SITE_NAME; ?></h1>
            <p class="text-gray-500">Acesse sua conta</p>
        </div>

        <?php if ($error): ?>
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span class="block sm:inline"><?php echo $error; ?></span>
            </div>
        <?php endif; ?>

        <form class="space-y-6" action="../modules/auth/login_action.php" method="POST">
            <div>
                <label for="email" class="text-sm font-medium text-gray-700">Email</label>
                <input type="email" name="email" id="email" required
                       class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-erp-blue-500 focus:border-erp-blue-500 sm:text-sm">
            </div>

            <div>
                <label for="senha" class="text-sm font-medium text-gray-700">Senha</label>
                <input type="password" name="senha" id="senha" required
                       class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-erp-blue-500 focus:border-erp-blue-500 sm:text-sm">
            </div>

            <div>
                <button type="submit"
                        class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-erp-blue-600 hover:bg-erp-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-erp-blue-500">
                    Entrar
                </button>
            </div>
        </form>
    </div>

</body>
</html>
