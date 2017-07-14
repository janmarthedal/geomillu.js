import * as mjAPI from 'mathjax-node';

mjAPI.config({
  MathJax: {
    // traditional MathJax configuration
  }
});
mjAPI.start();

const math = '\\frac{x}{y}';

mjAPI.typeset({
    math: math,
    format: "inline-TeX",
    useFontCache: false,
    svgNode: true
}, function (data) {
    if (!data.errors) {
        console.log(data.svgNode.outerHTML);
    }
});
