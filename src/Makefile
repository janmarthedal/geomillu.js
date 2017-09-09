TS = ../node_modules/typescript/bin/tsc --lib es2015,dom
OUTDIR := ../dst
TARGETS = $(addprefix $(OUTDIR)/,parse-svg.js illunode.js geomlib.js svg-writer.js tex-to-node.js illustration.js)

all: $(TARGETS)

$(OUTDIR)/geomlib.js: geomlib.ts
	$(TS) --outDir $(OUTDIR) --target ES5 $<

$(OUTDIR)/illunode.js: illunode.ts geomlib.ts
	$(TS) --outDir $(OUTDIR) --target ES5 $<

$(OUTDIR)/svg-writer.js: svg-writer.ts illunode.ts geomlib.ts
	$(TS) --outDir $(OUTDIR) --target ES5 $<

$(OUTDIR)/parse-svg.js: parse-svg.ts illunode.ts geomlib.ts
	$(TS) --outDir $(OUTDIR) --target ES5 $<

$(OUTDIR)/tex-to-node.js: tex-to-node.ts parse-svg.ts illunode.ts geomlib.ts
	$(TS) --outDir $(OUTDIR) --target ES5 $<

$(OUTDIR)/illustration.js: illustration.ts illunode.ts geomlib.ts tex-to-node.ts svg-writer.ts
	$(TS) --outDir $(OUTDIR) --target ES5 $<

$(TARGETS): | $(OUTDIR)

$(OUTDIR):
	mkdir $(OUTDIR)

clean:
	rm -f $(TARGETS)
