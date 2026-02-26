<?php require_once __DIR__ . '/../core/session.php'; ?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo SITE_NAME; ?></title>
    <!-- Usando Tailwind CSS via CDN para prototipagem rápida -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'erp-blue': {
                            '50': '#f0f8ff',
                            '100': '#e0f0fe',
                            '200': '#c2e3fd',
                            '300': '#a3d5fc',
                            '400': '#85c8fb',
                            '500': '#67baf9',
                            '600': '#48acf8',
                            '700': '#3b9ef7',
                            '800': '#2d8ff5',
                            '900': '#1f81f4',
                            '950': '#1c71e3'
                        }
                    }
                }
            }
        }
    </script>
</head>
<body class="bg-gray-100 font-sans">
    <div class="flex min-h-screen">
