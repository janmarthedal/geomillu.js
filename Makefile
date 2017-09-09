TS = ./node_modules/typescript/bin/tsc --lib es2015,dom
OUTDIR := dst
TARGETS = $(addprefix $(OUTDIR)/,test-illustration.js)

all: $(TARGETS)

$(OUTDIR)/test-illustration.js: test-illustration.ts src/illustration.ts src/geomlib.ts
	$(TS) --outDir $(OUTDIR) --target ES5 $<

$(TARGETS): | $(OUTDIR)

$(OUTDIR):
	mkdir $(OUTDIR)

clean:
	rm -f $(TARGETS)
