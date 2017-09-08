TS = ./node_modules/typescript/bin/tsc --lib es2015,dom
OUTDIR := dst
LIBTARGETS = $(addprefix $(OUTDIR)/,parse-svg.js illunode.js geomlib.js svg-writer.js tex-to-node.js illustration.js)
TESTTARGETS = $(addprefix $(OUTDIR)/,test-illustration.js)

all: $(LIBTARGETS) $(TESTTARGETS)

$(OUTDIR)/geomlib.js: src/geomlib.ts
	$(TS) --outDir $(OUTDIR) --target ES5 $<

$(OUTDIR)/illunode.js: src/illunode.ts src/geomlib.ts
	$(TS) --outDir $(OUTDIR) --target ES5 $<

$(OUTDIR)/svg-writer.js: src/svg-writer.ts src/illunode.ts src/geomlib.ts
	$(TS) --outDir $(OUTDIR) --target ES5 $<

$(OUTDIR)/parse-svg.js: src/parse-svg.ts src/illunode.ts src/geomlib.ts
	$(TS) --outDir $(OUTDIR) --target ES5 $<

$(OUTDIR)/tex-to-node.js: src/tex-to-node.ts src/parse-svg.ts src/illunode.ts src/geomlib.ts
	$(TS) --outDir $(OUTDIR) --target ES5 $<

$(OUTDIR)/illustration.js: src/illustration.ts src/illunode.ts src/geomlib.ts src/tex-to-node.ts src/svg-writer.ts
	$(TS) --outDir $(OUTDIR) --target ES5 $<

$(OUTDIR)/test-illustration.js: test-illustration.ts src/illustration.ts src/geomlib.ts
	$(TS) --outDir $(OUTDIR) --target ES5 $<

$(TARGETS): | $(OUTDIR)

$(OUTDIR):
	mkdir $(OUTDIR)

clean:
	rm -f $(LIBTARGETS) $(TESTTARGETS)

