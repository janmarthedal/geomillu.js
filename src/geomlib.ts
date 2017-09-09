export abstract class Element {
    abstract boundingBox(): Rectangle;
    hasInner(): boolean {
        return false;
    }
}

export class Point extends Element {
    readonly x: number;
    readonly y: number;
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
    toString(): string {
        return `${this.x} ${this.y}`;
    }
}

export class Matrix {
    /* [a c e]
       [b d f]
       [0 0 1] */
    readonly a: number;
    readonly b: number;
    readonly c: number;
    readonly d: number;
    readonly e: number;
    readonly f: number;
    static identity = new Matrix(1, 0, 0, 1, 0, 0);
    constructor(a: number, b: number, c: number, d: number, e: number, f: number) {
        this.a = a;  this.b = b;  this.c = c;  this.d = d;  this.e = e;  this.f = f;
    }
    multiply_point(p: Point): Point {
        return new Point(this.a * p.x + this.c * p.y + this.e, this.b * p.x + this.d * p.y + this.f);
    }
    multiply_matrix(p: Matrix): Matrix {
        return new Matrix(
            this.a * p.a + this.c * p.b,
            this.b * p.a + this.d * p.b,
            this.a * p.c + this.c * p.d,
            this.b * p.c + this.d * p.d,
            this.a * p.e + this.c * p.f + this.e,
            this.b * p.e + this.d * p.f + this.f
        );
    }
}

export class Vector {
    readonly x: number;
    readonly y: number;
    static zero = new Vector(0, 0);
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

export class Direction {
    readonly x: number;
    readonly y: number;
    constructor(v: number|Vector) {
        if (v instanceof Vector) {
            const length = Math.sqrt(v.x*v.x + v.y*v.y);
            this.x = v.x/length;
            this.y = v.y/length;
        } else {
            this.x = Math.cos(v);
            this.y = Math.sin(v);
        }
    }
    scale(s: number): Vector {
        return new Vector(this.x * s, this.y * s);
    }
    getAngle() {
        return Math.atan2(this.y, this.x);
    }
}

export class Rectangle extends Element {
    readonly base: Point;
    readonly size: Vector;
    constructor(base: Point, size: Vector) {
        super();
        if (size.x < 0 || size.y < 0)
            throw new Error(`Illegal rectangle size ${size.x} ${size.y}`);
        this.base = base;
        this.size = size;
    }
    boundingBox(): Rectangle {
        return this;
    }
    expand(v: number): Rectangle {
        return new Rectangle(new Point(this.base.x - v, this.base.y - v), new Vector(this.size.x + 2*v, this.size.y + 2*v));
    }
    hasInner() {
        return true;
    }
}

export class Polygon extends Element {
    readonly points: Point[];
    constructor(...points: Point[]) {
        super();
        this.points = [...points];
    }
    boundingBox(): Rectangle {
        return boundingBoxOfPoints(this.points);
    }
    hasInner() {
        return true;
    }
}

export class Line extends Element {
    readonly p1: Point;
    readonly p2: Point;
    constructor(p1: Point, p2: Point) {
        super();
        this.p1 = p1;
        this.p2 = p2;
    }
    boundingBox(): Rectangle {
        return boundingBoxOfPoints([this.p1, this.p2]);
    }
}

export interface PathSegment {
    command: string;
    data: (number|Point)[];
}

export class PathElement extends Element {
    data: PathSegment[] = [];
    addClose() {
        this.data.push({command: 'Z', data: []});
    }
    addMoveTo(p: Point) {
        this.data.push({command: 'M', data: [p]});
    }
    addLineTo(p: Point) {
        this.data.push({command: 'L', data: [p]});
    }
    addHorizontalTo(x: number) {
        this.data.push({command: 'H', data: [x]});
    }
    addVerticalTo(y: number) {
        this.data.push({command: 'V', data: [y]});
    }
    addQuadraticTo(p1: Point, p: Point) {
        this.data.push({command: 'Q', data: [p1, p]});        
    }
    addQuadraticToSmooth(p: Point) {
        this.data.push({command: 'T', data: [p]});        
    }
    addCubicTo(p1: Point, p2: Point, p: Point) {
        this.data.push({command: 'C', data: [p1, p2, p]});        
    }
    addCubicToSmooth(p2: Point, p: Point) {
        this.data.push({command: 'S', data: [p2, p]});
    }
    addArc(rx: number, ry: number, angle: number, largeArc: boolean, sweep: boolean, p: Point) {
        this.data.push({command: 'A', data: [rx, ry, angle, largeArc ? 1 : 0, sweep ? 1 : 0, p]});
    }
    isClosed() {
        return this.data[this.data.length - 1].command === 'Z';
    }
    boundingBox(): Rectangle {
        const xs = [];
        const ys = [];
        this.data.forEach(s => {
            switch (s.command) {
                case 'Z':
                    break;
                case 'H':
                    xs.push(s.data[0]);
                    break;
                case 'V':
                    ys.push(s.data[0]);
                    break;
                default:
                    const p = s.data[s.data.length - 1] as Point;
                    xs.push(p.x);
                    ys.push(p.y);
                    break;
            }
        });
        const p1 = new Point(Math.min(...xs), Math.min(...ys));
        const p2 = new Point(Math.max(...xs), Math.max(...ys));
        return new Rectangle(p1, p2.subtract(p1));
    }
    hasInner() {
        return true;
    }
}

export function boundingBoxOfPoints(points: Point[]): Rectangle {
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const p1 = new Point(Math.min(...xs), Math.min(...ys));
    const p2 = new Point(Math.max(...xs), Math.max(...ys));
    return new Rectangle(p1, p2.subtract(p1));
}

export function boundingBox(...objs: Element[]): Rectangle {
    const bbs = [...objs].map(o => o.boundingBox());
    const p1s = bbs.map(bb => bb.base);
    const p2s = bbs.map(bb => bb.base.plus(bb.size));
    return boundingBoxOfPoints([...p1s, ...p2s]);
}
