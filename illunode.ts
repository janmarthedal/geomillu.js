import {GeomObject} from './geomlib';

type length = number|string;

export interface DrawOptions {
    fill?: string;
    stroke?: length;
    'stroke-width'?: length;
}

export abstract class NodeWriter {
    abstract begin(): void;
    abstract end(): void;
    abstract beginAttr(attr: DrawOptions): void;
    abstract endAttr(): void;
    abstract beginTransform(a: number, b: number, c: number,
        d: number, e: number, f: number): void;
    abstract endTransform(): void;
}

export class DebugNodeWriter extends NodeWriter {
    indent: string = '';
    begin(): void {
        this.indent = '';
    }
    end(): void {}
    beginAttr(attr: DrawOptions): void {
        console.log(this.indent + 'attr' + 
            Object.keys(attr).map(k => ` ${k}="${attr[k]}"`).join(''));
        this.indent += '  ';
    }
    endAttr(): void {
        this.indent = this.indent.substr(2);
    }
    beginTransform(a: number, b: number, c: number, d: number, e: number, f: number): void {
        console.log(this.indent + `transform ${a} ${b} ${c} ${d} ${e} ${f}`);
        this.indent += '  ';
    }
    endTransform(): void {
        this.indent = this.indent.substr(2);
    }
}

export abstract class Node {
    //outline: Polygon;
    abstract write(writer: NodeWriter): void;
}

class ObjectNode extends Node {
    private obj: GeomObject;
    constructor(obj: GeomObject) {
        super();
        this.obj = obj;
    }
    write(writer: NodeWriter): void {
    }
}

class InternalNode extends Node {
    children: Node[];
    constructor() {
        super();
        this.children = [];
    }
    add(node: Node|GeomObject) {
        if (node instanceof GeomObject)
            node = new ObjectNode(node);
        this.children.push(node);
    }
    write(writer: NodeWriter): void {
        this.children.forEach(c => c.write(writer));
    }
}

export class AttrNode extends InternalNode {
    private attr: DrawOptions;
    constructor(attr: DrawOptions = {}) {
        super();
        this.attr = attr;
    }
    write(writer: NodeWriter): void {
        writer.beginAttr(this.attr);
        super.write(writer);
        writer.endAttr();
    }    
}

export class TransformNode extends InternalNode {
    /*
    [0 2 4]
    [1 3 5]
    */
    t: number[];
    constructor(a: number, b: number, c: number, d: number, e: number, f: number) {
        super();
        this.t = [a, b, c, d, e, f];
    }
    write(writer: NodeWriter): void {
        writer.beginTransform(this.t[0], this.t[1], this.t[2], this.t[3], this.t[4], this.t[5]);
        super.write(writer);
        writer.endTransform();
    }    
}
