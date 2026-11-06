<?php
require 'database.php';
header('Content-Type: application/json; charset=utf-8');

try {
    // Nodes
    $stmt = $db->prepare("
        SELECT 
            l.lesson_code,
            l.title,
            l.semester,
            l.cat_id,
            CASE 
                WHEN EXISTS (
                    SELECT 1
                    FROM teacher2lesson t2l
                    WHERE t2l.lesson_code = l.lesson_code
                      AND t2l.teacher_id IS NOT NULL
                      AND TRIM(CAST(t2l.teacher_id AS TEXT)) <> ''
                      AND TRIM(CAST(t2l.teacher_id AS TEXT)) <> '--'
                ) THEN 1
                ELSE 0
            END AS offered,
            (
                SELECT GROUP_CONCAT(t2l.teacher_id, ', ')
                FROM teacher2lesson t2l
                WHERE t2l.lesson_code = l.lesson_code
                  AND t2l.teacher_id IS NOT NULL
                  AND TRIM(CAST(t2l.teacher_id AS TEXT)) <> ''
                  AND TRIM(CAST(t2l.teacher_id AS TEXT)) <> '--'
            ) AS teachers
        FROM lesson l
    ");
    $stmt->execute();

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $nodes = [];
    foreach ($rows as $row) {
        $nodes[] = [
            "id" => $row["lesson_code"],
            "label" => $row["title"],
            "semester" => (int)$row["semester"],
            "cat_id" => $row["cat_id"],
            "offered" => (int)$row["offered"] === 1,
            "teachers" => $row["teachers"] ?: null,
            "main" => false
        ];
    }

    // Relations
    $stmt = $db->prepare("
        SELECT lesson_code, requirement_id, group_id
        FROM prereq2lesson
    ");
    $stmt->execute();

    $rels = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $groupCounts = [];
    foreach ($rels as $r) {
        $key = $r["lesson_code"] . ":" . $r["group_id"];
        if (!isset($groupCounts[$key])) {
            $groupCounts[$key] = 0;
        }
        $groupCounts[$key]++;
    }

    // Links
    $links = [];
    foreach ($rels as $r) {
        $key = $r["lesson_code"] . ":" . $r["group_id"];
        $type = ($groupCounts[$key] > 1) ? "OR" : "AND";

        $links[] = [
            "source" => $r["requirement_id"],
            "target" => $r["lesson_code"],
            "type"   => $type,
            "group"  => (int)$r["group_id"]
        ];
    }

    echo json_encode([
        "nodes" => $nodes,
        "links" => $links
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "error" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>