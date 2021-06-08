import { Attribute, Detail, Tag, Text } from "sax-wasm";

export enum NodeType {
    ELEMENT_NODE = 1,
    ATTRIBUTE_NODE = 2,
    TEXT_NODE = 3,
    CDATA_SECTION_NODE = 4,
    ENTITY_REFERENCE_NODE = 5,
    ENTITY_NODE = 6,
    PROCESSING_INSTRUCTION_NODE = 7,
    COMMENT_NODE = 8,
    DOCUMENT_NODE = 9,
    DOCUMENT_TYPE_NODE = 10,
    DOCUMENT_FRAGMENT_NODE = 11,
    NOTATION_NODE = 12,
}

export class SandboxNode {
    parsingData?: Text | Tag | Attribute;
    nodeType?: NodeType

    childNodes: SandboxNode[] = []
    nodeName?: string
    isSelfClosing = false

    constructor(type?: NodeType, data?: Text | Tag | Attribute) {
        this.parsingData = data
        this.nodeType = type

        if (type === NodeType.ELEMENT_NODE) {
            let tag = data as Tag
            this.nodeName = SandboxNode.normalizeName(tag.name)
        }
        else if (type === NodeType.DOCUMENT_NODE) {
            this.nodeName = "_ROOT_"
        }
    }

    appendChild(node: SandboxNode): SandboxNode {
        this.childNodes.push(node)
        return node
    }

    static normalizeName(name: string): string {
        return name.toLowerCase()
    }
}