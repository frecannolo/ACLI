echo Messaggio di GIT?
read MESSAGE

mkdir server
cp -r SERVER/* server
sudo mysqldump -ucano -pcano ACLI > server/sql/db.sql
git add *
git commit -a -m "$MESSAGE"
cat ~/token_frecannolo
sudo git push
sudo rm -r server
