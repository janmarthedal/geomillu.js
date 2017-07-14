import {GeomObject, Point, Vector, Matrix, PathElement, Rectangle, Polygon, boundingBox, boundingBoxOfPoints} from './geomlib';

type length = number|string;

export interface DrawOptions {
    fill?: string;
    stroke?: length;
    'stroke-width'?: length;
}

export abstract class NodeWriter {
    abstract begin(viewBox: Rectangle): void;
    abstract end(): void;
    abstract beginAttr(attr: DrawOptions): void;
    abstract endAttr(): void;
    abstract beginTransform(m: Matrix): void;
    abstract endTransform(): void;
    abstract writePath(e: PathElement): void;
    abstract writePolygon(e: Polygon): void;
    abstract writeRectangle(e: Rectangle): void;
}

function numOrPointToString(v: number|Point): string {
    return v instanceof Point ? `${v.x},${v.y}` : '' + v;
}

function expandRectangle(r: Rectangle, v: number): Rectangle {
    if (v < 0)
        throw new Error('expandRectangle: Illegal value');
    if (v === 0)
        return r;
    return new Rectangle(new Point(r.base.x - v, r.base.y - v), new Vector(r.size.x + 2*v, r.size.y + 2*v));
}

export class DebugNodeWriter extends NodeWriter {
    indent: string = '';
    begin(viewBox: Rectangle) {
        console.log(`${this.indent}doc viewBox ${viewBox.base.x} ${viewBox.base.y} ${viewBox.size.x} ${viewBox.size.y}`);
        this.indent += '  ';
    }
    end() {
        this.indent = this.indent.substr(2);
    }
    beginAttr(attr: DrawOptions) {
        console.log(this.indent + 'attr' + Object.keys(attr).map(k => ` ${k}="${attr[k]}"`).join(''));
        this.indent += '  ';
    }
    endAttr() {
        this.indent = this.indent.substr(2);
    }
    beginTransform(m: Matrix) {
        console.log(this.indent + `transform ${m.a} ${m.b} ${m.c} ${m.d} ${m.e} ${m.f}`);
        this.indent += '  ';
    }
    endTransform() {
        this.indent = this.indent.substr(2);
    }
    writePath(e: PathElement) {
        console.log(this.indent + 'path ' +
                    e.data.map(ps => ps.command +
                                     ps.data.map(v => ' ' + numOrPointToString(v)).join('')).join('; '));
    }
    writePolygon(e: Polygon) {
        console.log(this.indent + 'polygon ' + e.points.map(p => numOrPointToString(p)).join(' '));
    }
    writeRectangle(e: Rectangle) {
        console.log(`${this.indent}rect ${e.base.x} ${e.base.y} ${e.size.x} ${e.size.y}`);
    }
}

export abstract class Node {
    //outline: Polygon;
    abstract write(writer: NodeWriter): void;
    abstract getBBox(attr: DrawOptions): Rectangle;
}

class ObjectNode extends Node {
    private obj: GeomObject;
    constructor(obj: GeomObject) {
        super();
        this.obj = obj;
    }
    write(writer: NodeWriter): void {
        if (this.obj instanceof PathElement)
            writer.writePath(this.obj);
        else if (this.obj instanceof Polygon)
            writer.writePolygon(this.obj);
        else if (this.obj instanceof Rectangle)
            writer.writeRectangle(this.obj)
        else
            throw new Error('ObjectNode.write not implemented for object');
    }
    getBBox(attr: DrawOptions): Rectangle {
        let bbox = this.obj.boundingBox();
        const width = typeof attr['stroke-width'] === 'string' ? parseFloat(<string> attr['stroke-width']) : <number> attr['stroke-width'];
        if (attr.stroke !== 'none' && width > 0)
            bbox = expandRectangle(bbox, width/2);
        return bbox;
    }
}

class InternalNode extends Node {
    children: Node[];
    constructor() {
        super();
        this.children = [];
    }
    add(...nodes: (Node|GeomObject)[]) {
        nodes.forEach(node => {
            this.children.push(node instanceof GeomObject ? new ObjectNode(node) : node);
        });
    }
    write(writer: NodeWriter): void {
        this.children.forEach(c => c.write(writer));
    }
    getBBox(attr: DrawOptions): Rectangle {
        return boundingBox(...this.children.map(c => c.getBBox(attr)));
    }
}

export class Document extends InternalNode {
    viewBox: Rectangle;
    getBoundingBox(): Rectangle {
        return this.getBBox({stroke: 'none', 'stroke-width': 1});
    }
    setViewBox(viewBox: Rectangle, margin: number=0) {
        this.viewBox = expandRectangle(viewBox, margin);
    }
    write(writer: NodeWriter) {
        writer.begin(this.viewBox);
        super.write(writer);
        writer.end();
    }    
}

export class AttrNode extends InternalNode {
    readonly attr: DrawOptions;
    constructor(attr: DrawOptions = {}) {
        super();
        this.attr = attr;
    }
    write(writer: NodeWriter): void {
        writer.beginAttr(this.attr);
        super.write(writer);
        writer.endAttr();
    }
    getBBox(attr: DrawOptions): Rectangle {
        return super.getBBox({...attr, ...this.attr});
    }
}

export class TransformNode extends InternalNode {
    readonly m: Matrix;
    constructor(m: Matrix) {
        super();
        this.m = m;
    }
    write(writer: NodeWriter): void {
        writer.beginTransform(this.m);
        super.write(writer);
        writer.endTransform();
    }    
    getBBox(attr: DrawOptions): Rectangle {
        const bbox = super.getBBox(attr);
        const b = bbox.base;
        const s = bbox.size;
        return boundingBoxOfPoints([
            b, new Point(b.x + s.x, b.y), new Point(b.x, b.y + s.y), new Point(b.x + s.x, b.y + s.y)
        ].map(p => this.m.multiply(p)));
    }
}
