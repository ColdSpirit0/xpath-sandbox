import { NodeType, SandboxNode } from "./SandboxNode"
import { Text as SW_Text, Tag } from "sax-wasm"
import ISaxEventListener from "./ISaxWasmEventListener"
import xmldom from "xmldom-qsa"

type SandboxNodeContainer = {
    sandboxNode?: SandboxNode
}

export type XmldomNode = (XMLDocument | Node | Text) & SandboxNodeContainer


export default class DOMBuilder implements ISaxEventListener{
   
    documentNode?: SandboxNode
    openedNodesStack: SandboxNode[] = []
    selfClosedNodesStack: SandboxNode[] = []

    constructor() {
        this.documentNode = this.createNode(NodeType.DOCUMENT_NODE)
        this.openedNodesStack.push(this.documentNode)
    }

    onText(text: any): void {
        this.getLastOpenedNode().appendChild(this.createNode(NodeType.TEXT_NODE, text))
    }

    onOpenTag(tag: any): void {
        const node = this.createNode(NodeType.ELEMENT_NODE, tag)
        this.getLastOpenedNode().appendChild(node)
        this.openedNodesStack.push(node)
    }

    onCloseTag(tag: any): void {
        let lastNode = this.getLastOpenedNode()

        if (lastNode.nodeName === SandboxNode.normalizeName(tag.name)) {
            // if self closing node
            if (tag.isSelfClosing || (tag.closeStart.line === 0 && tag.closeStart.character === 0)) {
                lastNode.isSelfClosing = true

                // detach all child nodes and add to parent
                let parentNode = this.getLastOpenedNode(-1)
                parentNode.childNodes.push(...lastNode.childNodes)
                lastNode.childNodes = []
            }
            // if paired node
            // else {
            //     // all ok
            // }

            lastNode.parsingData = tag
            this.openedNodesStack.pop()
        }
        else {
            throw new Error(`Unknown node. Got: ${tag.name}, expected: ${lastNode.nodeName}.`);
        }
    }

    getLastOpenedNode(offset = 0) {
        return this.openedNodesStack[this.openedNodesStack.length - 1 + offset]
    }

    createNode(...args: any[]) {
        return new SandboxNode(...args)

        // proxy to watch accecs
        // let handler = {
        //     get: function(target: any, name: any) {
        //         if (name in target) {
        //             return target[name]
        //         }
                
        //         throw new Error(`Unknown node key: "${name}" of node "${target.nodeName}"`);
                
        //     }
        // }

        // let node = new SandboxNode(...args)
        // let proxy = new Proxy(node, handler)
        // return proxy as SandboxNode
        // return node
    }

    asXmldom(): XMLDocument {
        let xdoc: XMLDocument = new xmldom.DOMImplementation().createDocument(null, null, null)

        let processNodes = (origNode: SandboxNode, cloneNode: XmldomNode, ns?: string) => {
            // save sandbox data
            cloneNode.sandboxNode = origNode

            // create xmldoc node for each sandbox node child
            for (const child of origNode.childNodes) {
                let cloneChild: XmldomNode
                let namespace = ns

                // ELEMENT
                if (child.nodeType === NodeType.ELEMENT_NODE) {
                    if (child.nodeName === SandboxNode.normalizeName("svg")) {
                        namespace = "http://www.w3.org/2000/svg"
                    }

                    let cloneElement = xdoc.createElementNS(namespace!, child.nodeName!)

                    // copy attributes
                    let parsingData = child.parsingData! as Tag
                    for (const attribute of parsingData.attributes) {
                        // cloneElement.setAttribute(attribute.name.value, attribute.value.value)
                        let attrNode = xdoc.createAttribute(attribute.name.value) as any
                        attrNode.value = attribute.value.value

                        attrNode.sandboxNode = this.createNode(NodeType.ATTRIBUTE_NODE, attribute)
                        cloneElement.setAttributeNode(attrNode)
                    }

                    cloneChild = cloneElement
                }

                // TEXT
                else if (child.nodeType === NodeType.TEXT_NODE) {
                    cloneChild = xdoc.createTextNode((child.parsingData as SW_Text).value)
                }

                // ???
                else {
                    throw new Error(`Unknown node type: ${child.nodeType}`);
                }


                cloneNode.appendChild(cloneChild)
                processNodes(child, cloneChild!, namespace)
            }
        }

        processNodes(this.documentNode!, xdoc)
        return xdoc
    }
}