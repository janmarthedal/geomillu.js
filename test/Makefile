TS = ../node_modules/typescript/bin/tsc --lib es2015,dom
SRC = ../src
OUTDIR := ./dst
TARGETS = $(addprefix $(OUTDIR)/,test-illustration.js)

all: $(TARGETS)

$(OUTDIR)/test-illustration.js: test-illustration.ts $(SRC)/illustration.ts $(SRC)/geomlib.ts
	$(TS) --outDir $(OUTDIR) --target ES5 $<

$(TARGETS): | $(OUTDIR)

$(OUTDIR):
	mkdir $(OUTDIR)

clean:
	rm -f $(TARGETS)
