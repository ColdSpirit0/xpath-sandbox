import { Attribute, Tag, Text } from "sax-wasm";

export default interface ISaxEventListener {
    onText?(data: Text): void
    onAttribute?(data: Attribute): void
    onOpenTag?(data: Tag): void
    onCloseTag?(data: Tag): void
}