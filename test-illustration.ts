import {Point, Polygon, Line} from './geomlib';
import {Illustration} from './illustration';

const A = new Point(0, 0);
/*const B = new Point(4, 0);
const C = new Point(0, 3);
const poly = new Polygon(A, B, C);*/

const illustration = new Illustration();

illustration.setAttr({stroke: 'black', 'stroke-width': '0.001', fill: 'none'});
//illustration.add(poly);
illustration.add(new Line(new Point(-1, 0), new Point(1, 0)));
illustration.add(new Line(new Point(0, -1), new Point(0, 1)));
illustration.addText('Mx', A, 'SW')
    .then(() => {
        illustration.writeSVG(0.1);
    });
