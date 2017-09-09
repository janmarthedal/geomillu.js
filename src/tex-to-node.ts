import * as mjAPI from 'mathjax-node';
import {Matrix, Point, Rectangle, Vector, boundingBox} from './geomlib';
import {Document as giDocument, Node as giNode, GroupNode} from './illunode';
import {parseSVG} from './parse-svg';

mjAPI.config({
    MathJax: {}
});
mjAPI.start();

function parseEx(str: string): number {
    // Magic constant: https://jsfiddle.net/janmr/5bo9yaLo/
    return parseFloat(str.substr(0, str.length - 2)) / 2.26248;
}

function calcBbox(...nodes: giNode[]) {
    const n = new GroupNode();
    n.add(...nodes);
    return n.getBBox({});
}

export function TeXToNode(math: string, format: string) {
    return new Promise((resolve, reject) => {
        mjAPI.typeset({
            math: math,
            format: format,
            useFontCache: false,
            svgNode: true
        }, data => {
            if (data.errors)
                return reject(data.errors);
            const svg = parseSVG(<Element> data.svgNode);
            if (svg instanceof giDocument) {
                const c = svg.attr['viewBox'].split(' ').map(parseFloat);
                const viewBox = new Rectangle(new Point(c[0], c[1]), new Vector(c[2], c[3]));
                const w = parseEx(svg.attr['width']);
                //const h = parseEx(doc.attr['height']);
                const s = w / viewBox.size.x;
                const n = new GroupNode({}, new Matrix(s, 0, 0, -s, 0, 0));
                n.add(...svg.children);
                resolve({
                    node: n,
                    bounds: n.getBBox({})
                });
            } else
                reject('Expecting Document');
        });
    });
}
