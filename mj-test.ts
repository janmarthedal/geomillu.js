/// <reference types="jsdom" />

import * as mjAPI from 'mathjax-node';
import {AttrNode, TransformNode, Node, DebugNodeWriter} from './illunode';

mjAPI.config({
  MathJax: {
    // traditional MathJax configuration
  }
});
mjAPI.start();

const math = 'E = mc^2';

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

function parseSVGNode(node: Element, outNode: AttrNode|TransformNode) {
    let c = node.firstElementChild;
    while (c !== null) {
        switch (c.tagName.toLowerCase()) {
            case 'g':
                let subNode;
                if (c.hasAttribute('transform')) {
                    subNode = parseTransform(c.getAttribute('transform'), outNode);
                }
                if (subNode)
                    parseSVGNode(c, subNode);
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

mjAPI.typeset({
    math: math,
    format: "TeX",
    useFontCache: false,
    svgNode: true
}, function (data) {
    if (!data.errors) {
        const node = parseSVG(data.svgNode);
        const writer = new DebugNodeWriter();
        node.write(writer);
    }
});
