import {Element, Point, Vector, Matrix, PathElement, Rectangle, Line,
    Polygon, boundingBox, boundingBoxOfPoints} from './geomlib';

type length = number|string;

export interface DrawOptions {
    fill?: string;
    stroke?: length;
    'stroke-width'?: length;
}

export abstract class NodeWriter {
    abstract begin(attr: object): void;
    abstract end(): void;
    abstract beginGroup(attr: DrawOptions, m: Matrix): void;
    abstract endGroup(): void;
    abstract writePath(e: PathElement): void;
    abstract writePolygon(e: Polygon): void;
    abstract writeRectangle(e: Rectangle): void;
    abstract writeLine(e: Line): void;
}

function numOrPointToString(v: number|Point): string {
    return v instanceof Point ? `${v.x},${v.y}` : '' + v;
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
    beginGroup(attr: DrawOptions, m: Matrix) {
        console.log(this.indent + 'attr' + Object.keys(attr).map(k => ` ${k}="${attr[k]}"`).join('')
            + ` transform ${m.a} ${m.b} ${m.c} ${m.d} ${m.e} ${m.f}`);
        this.indent += '  ';
    }
    endGroup() {
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
    writeLine(e: Line) {
        console.log(this.indent + 'line ' + [e.p1, e.p2].map(p => numOrPointToString(p)).join(' '));
    }
    writeRectangle(e: Rectangle) {
        console.log(`${this.indent}rect ${e.base.x} ${e.base.y} ${e.size.x} ${e.size.y}`);
    }
}

export abstract class Node {
    //outline: Polygon;
    abstract write(writer: NodeWriter): void;
    abstract getBBox(attr: DrawOptions): Rectangle;
    simplify(): Node {
        return this;
    }
}

class ObjectNode extends Node {
    private obj: Element;
    constructor(obj: Element) {
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
        else if (this.obj instanceof Line)
            writer.writeLine(this.obj)            
        else
            throw new Error('ObjectNode.write not implemented for object');
    }
    getBBox(attr: DrawOptions): Rectangle {
        let bbox = this.obj.boundingBox();
        const width = typeof attr['stroke-width'] === 'string' ? parseFloat(<string> attr['stroke-width']) : <number> attr['stroke-width'];
        if (attr.stroke !== 'none' && width > 0)
            bbox = bbox.expand(width/2);
        return bbox;
    }
}

export class GroupNode extends Node {
    readonly attr: DrawOptions;
    readonly m: Matrix;
    readonly children: Node[] = [];
    constructor(attr: DrawOptions = {}, m: Matrix = Matrix.identity, ...nodes: (Node|Element)[]) {
        super();
        this.attr = attr;
        this.m = m;
        this.add(...nodes);
    }
    add(...nodes: (Node|Element)[]) {
        nodes.forEach(node => {
            this.children.push(node instanceof Element ? new ObjectNode(node) : node);
        });
    }
    write(writer: NodeWriter): void {
        writer.beginGroup(this.attr, this.m);
        this.children.forEach(c => c.write(writer));
        writer.endGroup();
    }
    getBBox(attr: DrawOptions): Rectangle {
        const a = {...attr, ...this.attr};
        const bbox = boundingBox(...this.children.map(c => c.getBBox(a)));
        const b = bbox.base;
        const s = bbox.size;
        return boundingBoxOfPoints([
            b, new Point(b.x + s.x, b.y), new Point(b.x, b.y + s.y), new Point(b.x + s.x, b.y + s.y)
        ].map(p => this.m.multiply_point(p)));
    }
    simplify() {
        const new_children = this.children.map(c => c.simplify());
        if (new_children.length === 1) {
            const child = new_children[0];
            if (child instanceof GroupNode) {
                return new GroupNode(
                    {...this.attr, ...child.attr},
                    this.m.multiply_matrix(child.m),
                    ...child.children.map(c => c.simplify())
                );
            }
        }
        return new GroupNode(this.attr, this.m, ...new_children);
    }
}

export class Document extends Node {
    readonly attr: object;
    readonly children: Node[] = [];
    constructor(attr: object) {
        super();
        this.attr = attr;
    }
    add(...nodes: (Node|Element)[]) {
        nodes.forEach(node => {
            this.children.push(node instanceof Element ? new ObjectNode(node) : node);
        });
    }
    getBBox(attr: DrawOptions): Rectangle {
        return boundingBox(...this.children.map(c => c.getBBox(attr)));
    }
    getBoundingBox(): Rectangle {
        return this.getBBox({stroke: 'none', 'stroke-width': 1});
    }
    write(writer: NodeWriter) {
        writer.begin(this.attr);
        this.children.forEach(c => c.write(writer));
        writer.end();
    }    
}
