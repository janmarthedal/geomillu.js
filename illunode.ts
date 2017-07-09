import {GeomObject} from './geomlib';

type length = number|string;

export interface DrawOptions {
    fill?: string;
    stroke?: length;
    'stroke-width'?: length;
}

class Node {
    //outline: Polygon;
}

class ObjectNode extends Node {
    private obj: GeomObject;
    constructor(obj: GeomObject) {
        super();
        this.obj = obj;
    }
}

class InternalNode extends Node {
    children: Node[];
    add(node: Node|GeomObject) {
        if (node instanceof GeomObject)
            node = new ObjectNode(node);
        this.children.push(node);
    }
}

export class AttrNode extends InternalNode {
    private attr: DrawOptions;
    constructor(attr: DrawOptions = {}) {
        super();
        this.attr = attr;
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
}
