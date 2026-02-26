<?php

class DB {
    private static $instance = null;
    private $pdo, $query, $error = false, $results, $count = 0;

    private function __construct() {
        try {
            $this->pdo = new PDO('mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8', DB_USER, DB_PASS);
            $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch (PDOException $e) {
            die('Erro de conexão: ' . $e->getMessage());
        }
    }

    public static function getInstance() {
        if (!isset(self::$instance)) {
            self::$instance = new DB();
        }
        return self::$instance;
    }

    public function query($sql, $params = []) {
        $this->error = false;
        if ($this->query = $this->pdo->prepare($sql)) {
            $x = 1;
            if (count($params)) {
                foreach ($params as $param) {
                    $this->query->bindValue($x, $param);
                    $x++;
                }
            }

            if ($this->query->execute()) {
                // Para SELECT, fetchAll. Para outros, rowCount.
                if (strpos(strtoupper($sql), 'SELECT') === 0) {
                    $this->results = $this->query->fetchAll(PDO::FETCH_OBJ);
                }
                $this->count = $this->query->rowCount();
            } else {
                $this->error = true;
                 // Log de erro mais detalhado
                error_log('Erro na query: ' . implode(' - ', $this->query->errorInfo()));
            }
        }
        return $this;
    }

    public function results() {
        return $this->results;
    }

    public function first() {
        return (!empty($this->results)) ? $this->results[0] : null;
    }

    public function count() {
        return $this->count;
    }

    public function lastInsertId() {
        return $this->pdo->lastInsertId();
    }

    public function error() {
        return $this->error;
    }
}
?>
