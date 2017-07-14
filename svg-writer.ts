import {JSDOM} from 'jsdom';
import {Rectangle, Point, Matrix, PathElement, Polygon} from './geomlib';
import {NodeWriter, DrawOptions} from './illunode';

const SVGNS = "http://www.w3.org/2000/svg";

function matrixToTransform(m: Matrix): string {
    if (m.a === 1 && m.b === 0 && m.c === 0 && m.d === 1)
        return `translate(${m.e},${m.f})`;
    if (m.b === 0 && m.c === 0 && m.e === 0 && m.f === 0)
        return m.a === m.d ? `scale(${m.a})` : `scale(${m.a},${m.d})`;
    return `matrix(${m.a} ${m.b} ${m.c} ${m.d} ${m.e} ${m.f})`;
}

export class SVGNodeWriter extends NodeWriter {
    private precision: number;
    private doc: Document;
    root: SVGSVGElement;
    path: SVGElement[] = [];
    constructor(precision: number=5) {
        super();
        this.precision = precision;
        this.doc = new JSDOM().window.document;
    }
    private numToString(v: number): string {
        let r = v.toPrecision(this.precision);
        if (r.indexOf('.') > 0) {
            let i = r.length;
            while (r[i-1] === '0') i--;
            if (r[i-1] === '.') i--;
            if (i !== r.length)
                r = r.substr(0, i);
        }
        return r;
    }
    private numOrPointToString(v: number|Point): string {
        return v instanceof Point ? this.numToString(v.x) + ',' + this.numToString(v.y) : this.numToString(v);
    }
    begin(viewBox: Rectangle): void {
        const node = this.doc.createElementNS(SVGNS, 'svg');
        if (viewBox)
            node.setAttribute('viewBox', [viewBox.base.x, viewBox.base.y, viewBox.size.x, viewBox.size.y].map(v => this.numToString(v)).join(' '));
        node.setAttribute('xmlns', SVGNS);
        this.root = node;
        this.path.push(node);
    }
    end(): void {
        this.path.pop();
        console.log(this.root.outerHTML);
    }
    beginAttr(attr: DrawOptions): void {
        const node = this.doc.createElementNS(SVGNS, 'g');
        Object.keys(attr).forEach(k => {
            node.setAttribute(k, attr[k]);
        });
        this.path[this.path.length - 1].appendChild(node);
        this.path.push(node);
    }
    endAttr(): void {
        this.path.pop();
    }
    beginTransform(m: Matrix): void {
        const node = this.doc.createElementNS(SVGNS, 'g');
        node.setAttribute('transform', matrixToTransform(m));
        this.path[this.path.length - 1].appendChild(node);
        this.path.push(node);
    }
    endTransform(): void {
        this.path.pop();
    }
    writePath(e: PathElement) {
        const node = this.doc.createElementNS(SVGNS, 'path');
        node.setAttribute('d', e.data.map(ps => ps.command +
                                     ps.data.map(v => this.numOrPointToString(v)).join(' ')).join(''));
        this.path[this.path.length - 1].appendChild(node);
    }
    writePolygon(e: Polygon) {
        const node = this.doc.createElementNS(SVGNS, 'polygon');
        node.setAttribute('points', e.points.map(p => this.numOrPointToString(p)).join(' '));
        this.path[this.path.length - 1].appendChild(node);
    }
    writeRectangle(e: Rectangle) {
        const node = this.doc.createElementNS(SVGNS, 'rect');
        node.setAttribute('x', this.numToString(e.base.x));
        node.setAttribute('y', this.numToString(e.base.y));
        node.setAttribute('width', this.numToString(e.size.x));
        node.setAttribute('height', this.numToString(e.size.y));
        this.path[this.path.length - 1].appendChild(node);
    }
}

