NPM = npm


#targets:
install :
	$(NPM) install

db-setup:
	npx prisma migrate dev

start:install db-setup
	$(NPM) run dev

dev:
	$(NPM) run dev

test:
	$(NPM) test

lint:
	$(NPM) run lint

prettier:
	$(NPM) run prettier
	$(NPM) run prettier:check

clean:
	rm -rf node_modules dist