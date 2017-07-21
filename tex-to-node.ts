import * as mjAPI from 'mathjax-node';

mjAPI.config({
    MathJax: {}
});
mjAPI.start();

export function TeXToNode(math: string, format: string) {
    return new Promise((resolve, reject) => {
        mjAPI.typeset({
            math: math,
            format: format,
            useFontCache: false,
            svgNode: true
        }, data => {
            if (data.errors)
                reject(data.errors);
            else
                resolve(data.svgNode);
        });
    });
}
