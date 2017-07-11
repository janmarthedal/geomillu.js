export abstract class GeomObject {
    abstract boundingBox(): Rectangle;
}

export class Point extends GeomObject {
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

export class Vector {
    readonly x: number;
    readonly y: number;
    static zero = new Vector(0, 0);
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

export class Rectangle extends GeomObject {
    readonly base: Point;
    readonly size: Vector;
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

export class Polygon extends GeomObject {
    readonly points: Point[];
    constructor(...points: Point[]) {
        super();
        this.points = [...points];
    }
    boundingBox(): Rectangle {
        return boundingBoxOfPoints(this.points);
    }
}

export interface PathSegment {
    command: string;
    data: (number|Point)[];
}

export class PathElement extends GeomObject {
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
    boundingBox(): Rectangle {
        throw new Error("Method not implemented.");
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
