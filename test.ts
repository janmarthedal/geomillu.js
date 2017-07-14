import {Point, Polygon, Matrix} from './geomlib';
import {AttrNode, TransformNode, Document} from './illunode';
import {TeXToNode} from './tex-to-node';
import {SVGNodeWriter} from './svg-writer';
import {parseSVG} from './parse-svg';

const A = new Point(0, 0);
const B = new Point(4, 0);
const C = new Point(0, 3);

const poly = new Polygon(A, B, C);
const root = new Document();
const g1 = new AttrNode({stroke: 'black', 'stroke-width': '0.1', fill: 'none'});

root.add(g1);
g1.add(poly);

const g2 = new TransformNode(new Matrix(0.001, 0, 0, 0.001, 4.1, 0.2));
const g3 = new AttrNode({stroke: 'none', fill: 'black'});
root.add(g2);
g2.add(g3);

const p = TeXToNode('x^2', 'inline-TeX')
    .then(jsroot => {
        const svg = parseSVG(<Element> jsroot);
        g3.add(...svg.children);
    });

p.then(() => {
    root.setViewBox(root.getBoundingBox(), 0.1);
    root.write(new SVGNodeWriter());
}).catch(err => console.error(err));
