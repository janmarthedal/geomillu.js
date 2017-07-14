import {Point, PathElement, Matrix, Rectangle, Vector} from './geomlib';
import {AttrNode, TransformNode, Node, Document, DrawOptions} from './illunode';


function parseTransform(v: string, outNode: Document|AttrNode|TransformNode): TransformNode {
    let match = v.match(/matrix\( *([-.0-9e]+) +([-.0-9e]+) +([-.0-9e]+) +([-.0-9e]+) +([-.0-9e]+) +([-.0-9e]+) *\)/);
    if (match) {
        const tnode = new TransformNode(new Matrix(parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3]), parseFloat(match[4]), parseFloat(match[5]), parseFloat(match[6])));
        outNode.add(tnode);
        return tnode;
    }
    match = v.match(/translate\( *([-.0-9e]+),([-.0-9e]+) *\)/);
    if (match) {
        const tnode = new TransformNode(new Matrix(1, 0, 0, 1, parseFloat(match[1]), parseFloat(match[2])));
        outNode.add(tnode);
        return tnode;
    }
    match = v.match(/scale\( *([-.0-9e]+) *\)/);
    if (match) {
        const s = parseFloat(match[1]);
        const tnode = new TransformNode(new Matrix(s, 0, 0, s, 0, 0));
        outNode.add(tnode);
        return tnode;
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

function parseSVGNode(node: Element, outNode: Document|AttrNode|TransformNode) {
    let c = node.firstElementChild;
    while (c !== null) {
        let subNode = outNode;
        const attr: DrawOptions = {};
        if (c.hasAttribute('transform')) {
            subNode = parseTransform(c.getAttribute('transform'), subNode);
        }
        ['font-family', 'stroke', 'stroke-width', 'fill'].forEach(key => {
            if (c.hasAttribute(key))
                attr[key] = c.getAttribute(key);
        });
        if (Object.keys(attr).length !== 0) {
            const n = new AttrNode(attr);
            subNode.add(n);
            subNode = n;
        }
        switch (c.tagName.toLowerCase()) {
            case 'g':
                parseSVGNode(c, subNode);
                break;
            case 'path':
                subNode.add(parseSVGPath(c.getAttribute('d')));
                break;
            case 'rect':
                subNode.add(new Rectangle(new Point(parseFloat(c.getAttribute('x')), parseFloat(c.getAttribute('y'))),
                                          new Vector(parseFloat(c.getAttribute('width')), parseFloat(c.getAttribute('height')))));
                break;
            default:
                console.log('Ignoring node ' + c.tagName);
        }
        c = c.nextElementSibling;
    }
}

export function parseSVG(root: Element): Document {
    const outRoot = new Document();
    parseSVGNode(root, outRoot);
    return outRoot;
}
