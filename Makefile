deploy:
	git checkout gh-pages
	git rebase -f master
	rm -r built index.html
	npm install
	webpack -p
	mv public/* ./
	rm -r javascript
	rm -r node_modules package.json webpack.config.js .eslintrc
	rm .gitignore LICENSE Makefile
	git commit -a -m "Deploying new gh-pages"
	git push -f -u origin gh-pages
