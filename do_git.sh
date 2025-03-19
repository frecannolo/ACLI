mkdir server
cp -r SERVER/* server
sudo mysqldump -ucano -pcano ACLI > server/sql/db.sql

