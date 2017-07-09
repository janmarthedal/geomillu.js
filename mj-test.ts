/// <reference types="jsdom" />

import * as mjAPI from 'mathjax-node';
import {AttrNode, TransformNode} from './illunode';

mjAPI.config({
  MathJax: {
    // traditional MathJax configuration
  }
});
mjAPI.start();

const math = 'E = mc^2';

function makeTransformNode(v: string): TransformNode {
    const match = v.match(/transform\( *(\d+) +(\d+) +(\d+) +(\d+) +(\d+) +(\d+) *\)/);
    if (match) {
        return new TransformNode(parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3]), parseFloat(match[4]), parseFloat(match[5]), parseFloat(match[6]));
    }
    throw new Error('Unsupported transform attribute');
}

function parseSVGNode(node: Element, outNode: AttrNode|TransformNode) {
    let c = node.firstElementChild;
    while (c !== null) {
        switch (c.tagName.toLowerCase()) {
            case 'g':
                if (c.hasAttribute('transform')) {
                    const tnode = makeTransformNode(c.getAttribute('transform'));
                    outNode.add(tnode);
                    outNode = tnode;
                }
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
}

mjAPI.typeset({
    math: math,
    format: "TeX",
    useFontCache: false,
    svgNode: true
}, function (data) {
    if (!data.errors) {
        parseSVG(data.svgNode);
    }
});
