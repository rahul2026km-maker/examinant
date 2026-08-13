git reset --mixed 28545df
git rm -r --cached server/service-account.json
git rm -r --cached server/.env
git add .
git commit -m "Add login page and backend setup"
git push origin main
