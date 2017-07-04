/******** GeomLib ********/

abstract class GeomObject {
    abstract boundingBox(): Rectangle;
}

class Point extends GeomObject {
    x: number;
    y: number;
    constructor(x: number, y: number) {
        super();
        this.x = x;
        this.y = y;
    }
    plus(v: Vector): Point {
        return new Point(this.x + v.x, this.y + v.y);
    }
    subtract(p2: Point): Vector {
        return new Vector(this.x - p2.x, this.y - p2.y);
    }
    boundingBox(): Rectangle {
        return new Rectangle(this, Vector.zero);
    }
    clone() : Point {
        return new Point(this.x, this.y);
    }
}

class Vector {
    x: number;
    y: number;
    static zero = new Vector(0, 0);
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

class Rectangle extends GeomObject {
    base: Point;
    size: Vector;
    constructor(base: Point, size: Vector) {
        super();
        if (size.x < 0 || size.y < 0)
            throw new Error('Illegal rectangle size');
        this.base = base;
        this.size = size;
    }
    boundingBox(): Rectangle {
        return this;
    }
}

class Polygon extends GeomObject {
    points: Point[];
    constructor(...points: Point[]) {
        super();
        this.points = points.map(p => p.clone());
    }
    boundingBox(): Rectangle {
        return boundingBoxOfPoints(this.points);
    }
}

function boundingBoxOfPoints(points: Point[]): Rectangle {
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const p1 = new Point(Math.min(...xs), Math.min(...ys));
    const p2 = new Point(Math.max(...xs), Math.max(...ys));
    return new Rectangle(p1, p2.subtract(p1));
}

function boundingBox(...objs: GeomObject[]): Rectangle {
    const bbs = [...objs].map(o => o.boundingBox());
    const p1s = bbs.map(bb => bb.base);
    const p2s = bbs.map(bb => bb.base.plus(bb.size));
    return boundingBoxOfPoints([...p1s, ...p2s]);
}

/******** GeomIllu ********/

class GeomObjectGroup extends GeomObject {
    elements: GeomObject[];
    constructor(...elements: GeomObject[]) {
        super();
        this.elements = elements;
    }
    add(element: GeomObject): void {
        this.elements.push(element);
    }
    boundingBox(): Rectangle {
        return boundingBox(...this.elements);
    }
}

type length = number|string;

interface DrawOptions {
    strokeWidth?: length;
}

class GeomIlluGroup {
    elements: {
        element: GeomObject|GeomIlluGroup;
        attrs: DrawOptions;
    }[] = [];
    add(obj: GeomObject, options: DrawOptions): void {
        this.elements.push({
            element: obj,
            attrs: options
        });
    }
    addGroup(attrs: DrawOptions={}): GeomIlluGroup {
        const group = new GeomIlluGroup();
        this.elements.push({
            element: group,
            attrs: attrs
        });
        return group;
    }
    boundingBox(): Rectangle {
        return boundingBox(...this.elements.map(e => e.element));
    }
    drawGroup(writer: GeomIlluWriter): string {
        return this.elements.map(({element, attrs}) => {
            if (element instanceof GeomIlluGroup) {
                writer.beginGroup(attrs);
                element.drawGroup(writer);
                writer.endGroup();
            } else if (element instanceof Polygon) {
                writer.polygon(element.points, attrs);
            } else {
                throw new Error("draw method not implemented.");
            }
        }).join('');
    }
}

abstract class GeomIlluWriter {
    abstract begin(bbox: Rectangle): void;
    abstract end(): void;
    abstract beginGroup(attrs: DrawOptions): void;
    abstract endGroup(): void;
    abstract polygon(points: Point[], attrs: DrawOptions): void;
    abstract toString(): string;
}

class GeomIllu extends GeomIlluGroup {
    constructor() {
        super();
    }
    draw(writer: GeomIlluWriter): string {
        const bbox = this.boundingBox();
        writer.begin(bbox);
        this.drawGroup(writer);
        writer.end();
        return writer.toString();
    }
}

class GeomIlluSVGWriter extends GeomIlluWriter {
    output: string = '';
    indent: string = '';
    static toPath(points: Point[], close: boolean): string {
        const d = points.map((p, k) => (k === 0 ? 'M' : 'L') + p.x + ' ' + p.y).join('');
        return close ? d + 'Z' : d;
    }
    private beginTag(name: string, attrs: object, close: boolean): void {
        this.output += this.indent + '<' + name + Object.keys(attrs).map(key => ` ${key}="${attrs[key]}"`) + (close ? '/' : '') + '>\n';
        if (!close) this.indent += '  ';
    }
    private endTag(name: string) {
        this.indent = this.indent.substr(0, this.indent.length - 2);
        this.output += this.indent + '</' + name + '>\n';
    }
    begin(bbox: Rectangle): void {
        this.beginTag('svg', {
            xmlns: 'http://www.w3.org/2000/svg',
            viewBox: `${bbox.base.x} ${bbox.base.y} ${bbox.size.x} ${bbox.size.y}`
        }, false);
    }
    end(): void {
        this.endTag('svg');
    }
    beginGroup(attrs: DrawOptions): void {
        this.beginTag('g', attrs, false);
    }
    endGroup(): void {
        this.endTag('g');
    }
    polygon(points: Point[], attrs: DrawOptions): void {
        this.beginTag('path', {
            ...attrs, 
            d: GeomIlluSVGWriter.toPath(points, true)
        }, true);
    }
    toString(): string {
        return this.output;
    }
}

const illu = new GeomIllu();

const A = new Point(0, 0);
const B = new Point(4, 0);
const C = new Point(0, 3);

illu.add(new Polygon(A, B, C), {strokeWidth: "0.1em"});

const writer = new GeomIlluSVGWriter();
illu.draw(writer);
console.log(writer.toString());
