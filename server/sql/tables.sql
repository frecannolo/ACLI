DROP TABLE posti_prenotazioni, prenotazioni, tavoli;

CREATE TABLE tavoli(
  id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
  x INT NOT NULL,
  y INT NOT NULL,
  orientamento INT NOT NULL,
  places INT NOT NULL
);

CREATE TABLE prenotazioni(
  id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
  nome TEXT NOT NULL,
  color VARCHAR(200) NOT NULL
);

CREATE TABLE posti_prenotazioni(
  id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
  index_row INT,
  index_col INT,
  id_prenotazione INT NOT NULL,
  id_tavolo INT NOT NULL,

  FOREIGN KEY(id_tavolo) REFERENCES tavoli(id),
  FOREIGN KEY(id_prenotazione) REFERENCES prenotazioni(id)
);
