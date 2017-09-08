import {Point, Polygon, Line} from './src/geomlib';
import {Illustration} from './src/illustration';

const A = new Point(0, 0);
const B = new Point(4, 0);
const C = new Point(0, 2);
const poly = new Polygon(A, B, C);

const illustration = new Illustration();

illustration.setAttr({stroke: 'black', 'stroke-width': '0.04', fill: 'none', 'font-size': 0.25});
illustration.add(poly);
illustration.addAngle(B, A, C);
illustration.addAngle(C, B, A);
illustration.addAngle(A, C, B);
illustration.addText('A', A, 'NE')
    .then(() => illustration.addText('A', A, 'NE'))
    .then(() => illustration.addText('B', B, 'NW'))
    .then(() => illustration.addText('C', C, 'SE'))
    .then(() => illustration.writeSVG(0.1));
