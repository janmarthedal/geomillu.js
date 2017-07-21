import {Element as giElement, Point, Matrix} from './geomlib';
import {AttrNode, TransformNode, Document} from './illunode';
import {TeXToNode} from './tex-to-node';
import {parseSVG} from './parse-svg';
import {SVGNodeWriter} from './svg-writer';

export class Illustration {
    static defaultAttrs = {stroke: 'black', 'stroke-width': '1', fill: 'none', 'stroke-linejoin': 'round'};
    private attrs: object = Illustration.defaultAttrs;
    private readonly nodes: AttrNode[];

    constructor() {
        this.nodes = [];
    }

    setAttr(attr: object) {
        this.attrs = {...this.attrs, ...attr};
    }

    add(element: giElement) {
        const n = new AttrNode(this.attrs);
        n.add(element);
        this.nodes.push(n);
    }

    addText(text: string, p: Point) {
        const n = new AttrNode(this.attrs);
        TeXToNode(text, 'inline-TeX')
            .then(jsroot => {
                const svg = parseSVG(<Element> jsroot);
                n.add(...svg.children);
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
