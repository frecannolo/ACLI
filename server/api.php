<?php
require 'libs/connection.php';

$conn = $GLOBALS['conn'];

if($_GET['command'] == 'add_table') {
  $params = json_decode(file_get_contents('php://input'));

  $stmt = $conn->prepare('INSERT INTO tavoli(x, y, orientamento, places) VALUES(?, ?, ?, ?)');
  $stmt->bind_param('iiii', $params->x, $params->y, $params->orientamento, $params->places);
  $stmt->execute();

  echo json_encode($stmt->insert_id);
}
elseif($_GET['command'] == 'get_tables') {
  $stmt = $conn->prepare('SELECT id, x, y, orientamento, places FROM tavoli');
  $stmt->execute();
  $stmt->store_result();
  $stmt->bind_result($id, $x, $y, $orientamento, $places);

  $res = array();
  while($stmt->fetch())
    $res[] = array(
      'id' => $id,
      'x' => $x,
      'y' => $y,
      'orientamento' => $orientamento,
      'row' => $places / 2,
      'prenotazioni' => array()
    );

  echo json_encode($res);
}
elseif($_GET['command'] == 'mod_coordinates_table') {
  $params = json_decode(file_get_contents('php://input'));
  $stmt = $conn->prepare('UPDATE tavoli SET x=?, y=? WHERE id=?');
  $stmt->bind_param('iii', $params->x, $params->y, $params->id);
  $stmt->execute();

  echo json_encode(true);
}
elseif($_GET['command'] == 'add_prenotazione') {
  $params = json_decode(file_get_contents('php://input'));
  $stmt = $conn->prepare('INSERT INTO prenotazioni (nome, color) VALUES (?, ?)');
  $stmt->bind_param('ss', $params->nome, $params->color);
  $stmt->execute();
  $ID = $stmt->insert_id;
  addPrenotazioni($conn, $params->prenotazioni, $ID);

  echo json_encode($ID);
}
elseif($_GET['command'] == 'get_prenotazioni') {
  $stmt = $conn->prepare('SELECT id, nome, color FROM prenotazioni');
  $stmt->execute();
  $stmt->store_result();
  $stmt->bind_result($id, $nome, $color);

  $res = array();
  while($stmt->fetch()) {
    $stmt1 = $conn->prepare('SELECT id, index_row, index_col, id_tavolo FROM posti_prenotazioni WHERE id_prenotazione=?');
    $stmt1->bind_param('i', $id);
    $stmt1->execute();
    $stmt1->store_result();
    $stmt1->bind_result($id_posto, $row, $col, $id_tavolo);

    $posti = array();
    while($stmt1->fetch())
      $posti[] = array(
        'id' => $id_posto,
        'index_row' => $row,
        'index_col' => $col,
        'id_tavolo' => $id_tavolo
      );

    $res[] = array(
      'id' => $id,
      'nome' => $nome,
      'color' => $color,
      'posti' => $posti
    );
  }

  echo json_encode($res);
}
elseif($_GET['command'] == 'mod_posti') {
  $params = json_decode(file_get_contents('php://input'));
  delPosti($conn, $params->id_pren);
  addPrenotazioni($conn, $params->nuove, $params->id_pren);
  echo json_encode(true);
}
elseif($_GET['command'] == 'mod_prenotazione') {
  $params = json_decode(file_get_contents('php://input'));

  $stmt = $conn->prepare('UPDATE prenotazioni SET nome=?, color=? WHERE id=?');
  $stmt->bind_param('ssi', $params->nome, $params->color, $params->id);
  $stmt->execute();

  delPosti($conn, $params->id);
  addPrenotazioni($conn, $params->posti, $params->id);

  echo json_encode(true);
}
elseif($_GET['command'] == 'del_prenotazione') {
  $params = json_decode(file_get_contents('php://input'));
  delPrenotazione($conn, $params->id);
  echo json_encode(true);
}
elseif($_GET['command'] == 'del_tavolo') {
  $params = json_decode(file_get_contents('php://input'));

  $stmt = $conn->prepare('SELECT pp.id_prenotazione
                          FROM posti_prenotazioni pp
                          WHERE pp.id_tavolo = ?
                          GROUP BY pp.id_prenotazione
                          HAVING COUNT(*) = (
                              SELECT COUNT(*)
                              FROM posti_prenotazioni pp1
                              WHERE pp1.id_prenotazione = pp.id_prenotazione
                          )'
  );
  $stmt->bind_param('i', $params->id);
  $stmt->execute();
  $stmt->store_result();
  $stmt->bind_result($id_prenotazione);

  while($stmt->fetch())
    delPrenotazione($conn, $id_prenotazione);

  $stmt = $conn->prepare('DELETE FROM posti_prenotazioni WHERE id_tavolo=?');
  $stmt->bind_param('i', $params->id);
  $stmt->execute();

  $stmt = $conn->prepare('DELETE FROM tavoli WHERE id=?');
  $stmt->bind_param('i', $params->id);
  $stmt->execute();

  echo json_encode(true);
}
elseif($_GET['command'] == 'mod_tavolo') {
  $params = json_decode(file_get_contents('php://input'));

  $stmt = $conn->prepare('UPDATE tavoli SET x=?, y=? WHERE id=?');
  $stmt->bind_param('iii', $params->x, $params->y, $params->id);
  $stmt->execute();

  if($params->is_or_changed) {
    $stmt = $conn->prepare('UPDATE tavoli SET orientamento=? WHERE id=?');
    $stmt->bind_param('ii', $params->orientamento, $params->id);
    $stmt->execute();

    $stmt = $conn->prepare('SELECT id, index_row, index_col FROM posti_prenotazioni WHERE id_tavolo=?');
    $stmt->bind_param('i', $params->id);
    $stmt->execute();
    $stmt->store_result();
    $stmt->bind_result($id_posto, $row, $col);

    while($stmt->fetch()) {
      $stmt1 = $conn->prepare('UPDATE posti_prenotazioni SET index_row=?, index_col=? WHERE id=?');
      $stmt1->bind_param('iii', $col, $row, $id_posto);
      $stmt1->execute();
    }
  }

  if($params->delta_row > 0)
    for($i = $params->old_row - 1, $n_changes = $params->delta_row; $n_changes > 0; $i --)
      if(!in_array($i, $params->rows_not_to_del)) {
        $stmt = $conn->prepare('UPDATE posti_prenotazioni SET index_row=(index_row - 1) WHERE id_tavolo=? AND index_row>=?');
        $stmt->bind_param('ii', $params->id, $i);
        $stmt->execute();

        $n_changes --;
      }

  $stmt = $conn->prepare('UPDATE tavoli SET places=(places - 2 * ?) WHERE id=?');
  $stmt->bind_param('ii', $params->delta_row, $params->id);
  $stmt->execute();

  echo json_encode(true);
}
elseif($_GET['command'] == 'repose_all') {
  $params = json_decode(file_get_contents('php://input'));

  foreach($params as $for_table) {
    foreach ($for_table->ids as $id)
      delPosti($conn, $id);

    $i_posto = 0;
    for ($i = 0; $i < $for_table->table->row; $i++) {
      for ($j = 0; $j < 2; $j++) {
        if ($for_table->table->orientamento == 0)
          addPosto($conn, $j, $i, $for_table->table->id, $for_table->posti_id[$i_posto]);
        else
          addPosto($conn, $i, $j, $for_table->table->id, $for_table->posti_id[$i_posto]);
        $i_posto++;

        if ($i_posto >= count($for_table->posti_id))
          break;
      }

      if($i_posto >= count($for_table->posti_id))
        break;
    }
  }

  echo json_encode($params);
}

function addPrenotazioni($conn, $prenotazioni, $ID) {
  foreach($prenotazioni as $pr) {
    $stmt = $conn->prepare('INSERT INTO posti_prenotazioni(index_row, index_col, id_prenotazione, id_tavolo) VALUES(?, ?, ?, ?)');
    $values = explode('_', $pr->str);
    $stmt->bind_param('iiii', $values[1], $values[2], $ID, $values[0]);
    $stmt->execute();
  }
}

function delPosti($conn, $ID) {
  $stmt = $conn->prepare('DELETE FROM posti_prenotazioni WHERE id_prenotazione=?');
  $stmt->bind_param('i', $ID);
  $stmt->execute();
}

function delPrenotazione($conn, $ID) {
  delPosti($conn, $ID);
  $stmt = $conn->prepare('DELETE FROM prenotazioni WHERE id=?');
  $stmt->bind_param('i', $ID);
  $stmt->execute();
}

function addPosto($conn, $i, $j, $id_ta, $id_pre) {
  $stmt = $conn->prepare('INSERT INTO posti_prenotazioni(index_row, index_col, id_prenotazione, id_tavolo) VALUES(?, ?, ?, ?)');
  $stmt->bind_param('iiii', $i, $j, $id_pre, $id_ta);
  $stmt->execute();
}
