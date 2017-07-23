import {Element as giElement, Point, Matrix, Rectangle, PathElement} from './geomlib';
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
        const attrPicker = (element instanceof Rectangle || 
            (element instanceof PathElement && element.isClosed))
            ? Illustration.allAttrs : Illustration.strokeAttrs;        
        const n = new AttrNode(pick(this.attrs, attrPicker));
        n.add(element);
        this.nodes.push(n);
    }

    // Vertical: NMBS, horizontal: WME
    addText(text: string, p: Point, anchor: string) {
        const fontSize = this.attrs['font-size'];
        anchor = anchor || 'BW';
        return TeXToNode(text, 'inline-TeX')
            .then((data: any) => {
                let dx: number, dy: number;
                switch (anchor[0]) {
                    case 'N':
                        dy = data.bounds.base.y + data.bounds.size.y;
                        break;
                    case 'M':
                        dy = data.bounds.base.y + data.bounds.size.y/2;
                        break;
                    case 'B':
                        dy = 0;
                        break;
                    case 'S':
                        dy = data.bounds.base.y;
                        break;
                }
                switch (anchor[1]) {
                    case 'W':
                        dx = data.bounds.base.x;
                        break;
                    case 'M':
                        dx = data.bounds.base.x + data.bounds.size.x/2;
                        break;
                    case 'E':
                        dx = data.bounds.base.x + data.bounds.size.x;
                        break;
                }
                const tn = new TransformNode(
                    new Matrix(fontSize, 0, 0, fontSize, p.x - dx, p.y - dy));
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
