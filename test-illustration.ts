import {Point, Polygon} from './geomlib';
import {Illustration} from './illustration';

const A = new Point(0, 0);
const B = new Point(4, 0);
const C = new Point(0, 3);
const poly = new Polygon(A, B, C);

const illustration = new Illustration();

illustration.setAttr({stroke: 'black', 'stroke-width': '0.1', fill: 'none'});
illustration.add(poly);
illustration.writeSVG(0.1);
