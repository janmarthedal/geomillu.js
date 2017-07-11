import {JSDOM} from 'jsdom';
import {Point, PathElement} from './geomlib';
import {AttrNode, TransformNode, Node, DebugNodeWriter} from './illunode';


function parseTransform(v: string, outNode: AttrNode|TransformNode): TransformNode {
    let match = v.match(/matrix\( *([-.0-9e]+) +([-.0-9e]+) +([-.0-9e]+) +([-.0-9e]+) +([-.0-9e]+) +([-.0-9e]+) *\)/);
    if (match) {
        const tnode = new TransformNode(parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3]), parseFloat(match[4]), parseFloat(match[5]), parseFloat(match[6]));
        outNode.add(tnode);
        return tnode;
    }
    match = v.match(/translate\( *([-.0-9e]+),([-.0-9e]+) *\)/);
    if (match) {
        const tnode = new TransformNode(1, 0, 0, 1, parseFloat(match[1]), parseFloat(match[2]));
        outNode.add(tnode);
        return tnode;
    }
    match = v.match(/scale\( *([-.0-9e]+) *\)/);
    if (match) {
        const s = parseFloat(match[1]);
        const tnode = new TransformNode(s, 0, 0, s, 0, 0);
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

function parseSVGNode(node: Element, outNode: AttrNode|TransformNode) {
    let c = node.firstElementChild;
    while (c !== null) {
        let subNode = outNode;
        if (c.hasAttribute('transform')) {
            subNode = parseTransform(c.getAttribute('transform'), subNode);
        }
        switch (c.tagName.toLowerCase()) {
            case 'g':
                parseSVGNode(c, subNode);
                break;
            case 'path':
                outNode.add(parseSVGPath(c.getAttribute('d')));
                break;
            default:
                console.log('Ignoring node ' + c.tagName);
        }
        c = c.nextElementSibling;
    }
}

function parseSVG(root: Element) {
    console.log('Input: ' + root.outerHTML);
    if (root.tagName.toLowerCase() !== 'svg')
        throw new Error('Not svg node');
    const outRoot = new AttrNode();
    parseSVGNode(root, outRoot);
    return outRoot;
}

(function() {
    const dom = new JSDOM(`<svg viewBox="-0.3 -0.1 4.4 3.4" xmlns="http://www.w3.org/2000/svg">
  <g font-family="arial">
    <g stroke="black" stroke-width="0.04" fill="transparent">
      <path d="M 0 3 L 4 3 L 0 0 Z" stroke-linejoin="round" />
      <path d="M 0 2.8 L 0.2 2.8 L 0.2 3" stroke-linejoin="miter" />
    </g>
    <text x="-0.12" y="3.15" font-size="0.3" text-anchor="middle">A</text>
  </g>
</svg>`);
    const root = dom.window.document.querySelector('svg');
    console.log(root.outerHTML);
    const node = parseSVG(root);
    const writer = new DebugNodeWriter();
    node.write(writer);
})();
