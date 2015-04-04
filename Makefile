package: public
	webpack -p
	rm -rf output
	mkdir output
	cp -r public/built output/built
	cp public/index.html output/index.html
	cp -r public/javascript output
	tar -cvjf output.tar.bz2 output
	du -h -d 0 output output.tar.bz2