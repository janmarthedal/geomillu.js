import {Element as giElement, Point, Matrix, Rectangle, PathElement, Vector, Direction} from './geomlib';
import {AttrNode, TransformNode, Document} from './illunode';
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
        stroke: 'black',
        'stroke-width': '1',
        fill: 'none',
        'stroke-linejoin': 'round',
        'font-size': 1
    };
    static strokeAttrs = ['stroke', 'stroke-width', 'stroke-linejoin'];
    static allAttrs = Illustration.strokeAttrs.concat(['fill']);
    private attrs: object = Illustration.defaultAttrs;
    private readonly nodes: (AttrNode|TransformNode)[];

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
        const n = new AttrNode(pick(this.attrs, attrPicker));
        n.add(element);
        this.nodes.push(n);
    }

    // Vertical: NMBS, horizontal: WME
    addText(text: string, p: Point, anchor: string, offset?: number) {
        const fontSize = this.attrs['font-size'];
        if (typeof offset === 'undefined')
            offset = 0.1;
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
                const tn = new TransformNode(
                    new Matrix(fontSize, 0, 0, fontSize, p.x + (ofs.x - dx) * fontSize, p.y + (ofs.y - dy) * fontSize)
                );
                const an = new AttrNode(pick(this.attrs, Illustration.allAttrs));
                tn.add(an);
                an.add(data.node);
                this.nodes.push(tn);
            });
    }

    writeSVG(margin: number) {
        const transform = new TransformNode(new Matrix(1, 0, 0, -1, 0, 0));
        transform.add(...this.nodes);
        const canvas = new Document({
            viewBox: transform.getBBox(Illustration.defaultAttrs).expand(margin)
        });
        canvas.add(transform);
        canvas.write(new SVGNodeWriter());
    }
}
