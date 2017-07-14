TARGETS = test-parse-svg.js parse-svg.js illunode.js geomlib.js svg-writer.js test.js mj-test.js tex-to-node.js

all: $(TARGETS)

%.js: %.ts
	tsc --lib es2015,dom $^

clean:
	rm -f $(TARGETS)
