import {Point, Polygon} from './geomlib';
import {AttrNode} from './illunode';

const A = new Point(0, 0);
const B = new Point(4, 0);
const C = new Point(0, 3);

const poly = new Polygon(A, B, C);
const root = new AttrNode({stroke: 'black', 'stroke-width': '0.1', fill: 'none'});

root.add(poly);
