import {Point, PathElement, Matrix, Rectangle, Vector} from './geomlib';
import {AttrNode, TransformNode, Node, Document, DrawOptions} from './illunode';


function parseTransform(v: string): TransformNode {
    let match = v.match(/matrix\( *([-.0-9e]+) +([-.0-9e]+) +([-.0-9e]+) +([-.0-9e]+) +([-.0-9e]+) +([-.0-9e]+) *\)/);
    if (match)
        return new TransformNode(new Matrix(parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3]), parseFloat(match[4]), parseFloat(match[5]), parseFloat(match[6])));
    match = v.match(/translate\( *([-.0-9e]+),([-.0-9e]+) *\)/);
    if (match)
        return new TransformNode(new Matrix(1, 0, 0, 1, parseFloat(match[1]), parseFloat(match[2])));
    match = v.match(/scale\( *([-.0-9e]+) *\)/);
    if (match) {
        const s = parseFloat(match[1]);
        return new TransformNode(new Matrix(s, 0, 0, s, 0, 0));
    }
    throw new Error(`Unsupported transform attribute "${v}"`);
}

function parseSVGPath(d: string): PathElement {
    const node = new PathElement();
    d.match(/[A-Z][^A-Z]*/g).forEach(c => {
        const cmd = c[0];
        const n = c.substr(1).trim().split(/ *[ ,] */).map(parseFloat);
        switch (cmd) {
            case 'M':
                node.addMoveTo(new Point(n[0], n[1]));
                break;
            case 'L':
                node.addLineTo(new Point(n[0], n[1]));
                break;
            case 'Q':
                node.addQuadraticTo(new Point(n[0], n[1]), new Point(n[2], n[3]));
                break;
            case 'T':
                node.addQuadraticToSmooth(new Point(n[0], n[1]));
                break;
            case 'H':
                node.addHorizontalTo(n[0]);
                break;
            case 'V':
                node.addVerticalTo(n[0]);
                break;
            case 'C':
                node.addCubicTo(new Point(n[0], n[1]), new Point(n[2], n[3]), new Point(n[4], n[5]));
                break;
            case 'S':
                node.addCubicToSmooth(new Point(n[0], n[1]), new Point(n[2], n[3]));
                break;
            case 'Z':
                node.addClose();
                break;
            default:
                throw new Error(`Unsupported path command ${cmd}`);
        }
    });
    return node;
}

function addChildTo(node: Document|AttrNode|TransformNode, child: AttrNode|TransformNode) {
    node.add(child);
    return child;
}

export function parseSVG(node: Element): Document|AttrNode|TransformNode {
    let outNode: Document|AttrNode|TransformNode;
    let subNode: Document|AttrNode|TransformNode;
    if (node.tagName.toLowerCase() === 'svg') {
        const attr = {};
        Array.from(node.attributes).forEach(a => {
            attr[a.name] = a.value;
        });
        outNode = subNode = new Document(attr);
    } else {
        const attr: DrawOptions = {};
        outNode = subNode = new AttrNode();
        if (node.hasAttribute('transform')) {
            subNode = addChildTo(subNode, parseTransform(node.getAttribute('transform')));
        }
        ['font-family', 'stroke', 'stroke-width', 'fill'].forEach(key => {
            if (node.hasAttribute(key))
                attr[key] = node.getAttribute(key);
        });
        if (Object.keys(attr).length !== 0) {
            subNode = addChildTo(subNode, new AttrNode(attr));
        }
        switch (node.tagName.toLowerCase()) {
            case 'g':
                break;
            case 'path':
                subNode.add(parseSVGPath(node.getAttribute('d')));
                break;
            case 'rect':
                subNode.add(new Rectangle(new Point(parseFloat(node.getAttribute('x')), parseFloat(node.getAttribute('y'))),
                                          new Vector(parseFloat(node.getAttribute('width')), parseFloat(node.getAttribute('height')))));
                break;
            case 'title':
                // Ignore
                return undefined;
            default:
                throw new Error('Unsupported node ' + node.tagName);
        }
        outNode = <Document|AttrNode|TransformNode> outNode.children[0];
    }
    let c = node.firstElementChild;
    while (c !== null) {
        const outChild = parseSVG(c);
        if (outChild)
            subNode.add(outChild)
        c = c.nextElementSibling;
    }
    return outNode;
}
