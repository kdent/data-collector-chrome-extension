DIR=chrome-extension-data-collector

zip:
	cd ..; zip -r $(DIR).zip $(DIR) -x '*.git*' '*Makefile'

clean:
	cd ..; rm -r $(DIR).zip
