# Shortcuts for the npm scripts. Run `make` on its own to see them.

.PHONY: help install test cv app new

# $(info) prints from make itself, so this works without a Unix shell on Windows.
help:
	$(info make install                                          install the test and build tools)
	$(info make test                                             run all checks (site + CV))
	$(info make cv                                               build the public CV)
	$(info make new COMPANY="Acme" ROLE="Platform Engineer"      start a new application)
	$(info make app APP="Acme/Platform Engineer"                 build its CV and cover letter)
	@:

install:
	npm install

test:
	npm test

cv:
	npm run cv

app:
	$(if $(APP),,$(error Say which application: make app APP="Acme/Platform Engineer"))
	npm run cv -- "$(APP)"

new:
	$(if $(and $(COMPANY),$(ROLE)),,$(error Give both: make new COMPANY="Acme" ROLE="Platform Engineer"))
	npm run cv:new -- "$(COMPANY)" "$(ROLE)"
