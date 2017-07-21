OUTDIR := dst
TARGETS = $(addprefix $(OUTDIR)/,test-parse-svg.js parse-svg.js illunode.js geomlib.js \
	svg-writer.js test.js mj-test.js tex-to-node.js illustration.js test-illustration.js)

all: $(TARGETS)

$(OUTDIR)/%.js: %.ts
	tsc --lib es2015,dom --outDir $(OUTDIR) --target ES5 $^

$(TARGETS): | $(OUTDIR)

$(OUTDIR):
	mkdir $(OUTDIR)

clean:
	rm -f $(TARGETS)

