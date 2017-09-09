import {Element as giElement, Point, Matrix, Rectangle, PathElement, Vector, Direction} from './geomlib';
import {GroupNode, Document} from './illunode';
import {TeXToNode} from './tex-to-node';
import {SVGNodeWriter} from './svg-writer';

function pick(obj: {[key: string]: any}, keys: string[]): {[key: string]: any} {
    const result = {};
    keys.forEach(key => {
        if (obj.hasOwnProperty(key))
            result[key] = obj[key];
    });
    return result;
}

export class Illustration {
    static defaultAttrs = {
        stroke: 'none',
        'stroke-width': '1',
        fill: 'black',
        'stroke-linejoin': 'miter',
        'font-size': 1
    };
    static strokeAttrs = ['stroke', 'stroke-width', 'stroke-linejoin', 'stroke-miterlimit'];
    static allAttrs = Illustration.strokeAttrs.concat(['fill']);
    private attrs: object = Illustration.defaultAttrs;
    private readonly nodes: GroupNode[];

    constructor() {
        this.nodes = [];
    }

    setAttr(attr: object) {
        this.attrs = {...this.attrs, ...attr};
    }

    /*
    Point
    Line
    Rectangle
    PathElement
    */
    add(element: giElement) {
        // TODO: What to do about Point?
        const attrPicker = element.hasInner() ? Illustration.allAttrs : Illustration.strokeAttrs;
        const n = new GroupNode(pick(this.attrs, attrPicker));
        n.add(element);
        this.nodes.push(n);
    }

    // Vertical: NMBS, horizontal: WME
    addText(text: string, p: Point, anchor: string, offset?: number) {
        const fontSize = this.attrs['font-size'];
        if (typeof offset === 'undefined')
            offset = 0.2*fontSize;
        return TeXToNode(text, 'inline-TeX')
            .then((data: any) => {
                let dx: number, dy: number, ofsx: number, ofsy: number;
                switch (anchor[0]) {
                    case 'N':
                        dy = data.bounds.base.y + data.bounds.size.y;
                        ofsy = -1;
                        break;
                    case 'M':
                        dy = data.bounds.base.y + data.bounds.size.y/2;
                        ofsy = 0;
                        break;
                    case 'B':
                        dy = 0;
                        ofsy = 0;
                        break;
                    case 'S':
                        dy = data.bounds.base.y;
                        ofsy = 1;
                        break;
                }
                switch (anchor[1]) {
                    case 'W':
                        dx = data.bounds.base.x;
                        ofsx = 1;
                        break;
                    case 'M':
                        dx = data.bounds.base.x + data.bounds.size.x/2;
                        ofsx = 0;
                        break;
                    case 'E':
                        dx = data.bounds.base.x + data.bounds.size.x;
                        ofsx = -1;
                        break;
                }
                const ofs = ofsx === 0 && ofsy === 0 ? Vector.zero : new Direction(new Vector(ofsx, ofsy)).scale(offset);
                this.nodes.push(new GroupNode(
                    pick(this.attrs, Illustration.allAttrs),
                    new Matrix(fontSize, 0, 0, fontSize, p.x - dx * fontSize + ofs.x, p.y - dy * fontSize + ofs.y),
                    data.node
                ));
            });
    }

    addAngle(a: Point, b: Point, c: Point, radius?: number) {
        const pe = new PathElement();
        const dir1 = new Direction(a.subtract(b));
        const dir2 = new Direction(c.subtract(b));
        if (typeof radius !== 'number')
            radius = this.attrs['font-size'];
        const sinus = Math.sin(dir2.getAngle() - dir1.getAngle());
        const v1 = dir1.scale(radius);
        const v2 = dir2.scale(radius);
        pe.addMoveTo(b.plus(v1));
        if (1-sinus < 1e-8) {
            pe.addLineTo(b.plus(v1).plus(v2));
            pe.addLineTo(b.plus(v2));
        } else {
            pe.addArc(radius, radius, 0, sinus < 0, true, b.plus(v2));
        }
        this.nodes.push(new GroupNode({...pick(this.attrs, Illustration.strokeAttrs), fill: 'none'}, Matrix.identity, pe));
    }

    writeSVG(margin: number) {
        const transform = new GroupNode({}, new Matrix(1, 0, 0, -1, 0, 0),
                                        ...this.nodes);
        const canvas = new Document({
            viewBox: transform.getBBox(Illustration.defaultAttrs).expand(margin)
        });
        canvas.add(transform.simplify());
        canvas.write(new SVGNodeWriter());
    }
}
