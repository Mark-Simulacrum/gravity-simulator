compile:
	./node_modules/.bin/babel public --out-dir out --copy-files
	./node_modules/.bin/browserify out/javascript/index.js -o out/bundle.js
	echo '<script>' >> out/index.html
	cat out/bundle.js >> out/index.html
	echo '</script>' >> out/index.html
	-rm -r out/javascript
	-rm -r out/bundle.js

deploy:
	git pull
	git checkout gh-pages
	git checkout master -- `git ls-tree --name-only -r master`
	npm install
	make compile
	cp out/index.html ./index.html
	rm -r public node_modules .eslintrc .gitignore LICENSE Makefile package.json out
	git commit -a -m "Deploying new gh-pages"
	git push -f -u origin gh-pages

watch-compile:
	fswatch -o ./public | xargs -n1 -I{} make compile