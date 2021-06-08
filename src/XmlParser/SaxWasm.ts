import { Readable } from "stream"
import { SaxEventType, SAXParser } from 'sax-wasm';
import saxWasmBuffer from "./SaxWasmBuffer"
import ISaxWasmEventListener from "./ISaxWasmEventListener";

export default class SaxWasm {
    // neededData = 0
    neededData = 
        SaxEventType.Text |
        // SaxEventType.ProcessingInstruction |
        // SaxEventType.SGMLDeclaration |
        // SaxEventType.Doctype |
        // SaxEventType.Comment |
        // SaxEventType.OpenTagStart |
        // SaxEventType.Attribute |
        SaxEventType.OpenTag |
        SaxEventType.CloseTag 
        // SaxEventType.Cdata

    options = { highWaterMark: 32 * 1024 }; // 32k chunks
    parser?: SAXParser
    saxWasmBuffer?: Buffer
    ready = false


    eventNames: { [event: number]: string } = {
        1: "Text",
        2: "ProcessingInstruction",
        4: "SGMLDeclaration",
        8: "Doctype",
        16: "Comment",
        32: "OpenTagStart",
        64: "Attribute",
        128: "OpenTag",
        256: "CloseTag",
        512: "Cdata",
    }

    async init() {
        this.parser = new SAXParser(this.neededData, this.options);
        this.saxWasmBuffer = Buffer.from(saxWasmBuffer)
        this.ready = await this.parser.prepareWasm(this.saxWasmBuffer)
    }

    async run(text: string, listener: ISaxWasmEventListener) {
        if (!this.ready) throw new Error("SaxWasm parser not initialized");

        let parser = this.parser!
        parser.eventHandler = this.getEventHandler(listener)

        let ready = await parser.prepareWasm(this.saxWasmBuffer!)

        if (ready) {
            await this.readStream(text, parser)
        }
    }

    private readStream(text: string, parser: SAXParser) {
        return new Promise<void>(resolve => {
            const readable = this.createStream(text)

            readable.on('data', (chunk) => {
                // console.log(chunk)
                parser.write(chunk);
            });

            readable.on('end', () => {
                resolve()
                parser.end()
            });
        })
    }

    getEventHandler(listener: ISaxWasmEventListener) {
        return (event: SaxEventType, data: any) => {
            switch (event) {
                case SaxEventType.Text:
                    listener?.onText?.call(listener, data.toJSON()); break

                // case SaxEventType.ProcessingInstruction:
                //     listener?.onProcessingInstruction?.call(listener, data.toJSON()); break

                // case SaxEventType.SGMLDeclaration:
                //     listener?.onSGMLDeclaration?.call(listener, data.toJSON()); break

                // case SaxEventType.Doctype:
                //     listener?.onDoctype?.call(listener, data.toJSON()); break

                // case SaxEventType.Comment:
                //     listener?.onComment?.call(listener, data.toJSON()); break

                // case SaxEventType.OpenTagStart:
                //     listener?.onOpenTagStart?.call(listener, data.toJSON()); break

                // case SaxEventType.Attribute:
                //     listener?.onAttribute?.call(listener, data.toJSON()); break

                case SaxEventType.OpenTag:
                    listener?.onOpenTag?.call(listener, data.toJSON()); break

                case SaxEventType.CloseTag:
                    listener?.onCloseTag?.call(listener, data.toJSON()); break

                // case SaxEventType.Cdata:
                //     listener?.onCdata?.call(listener, data.toJSON()); break

                default:
                    throw new Error("Unsupported event type");
            }
        }
    }

    createStream(str: string) {
        const s = new Readable()
        s._read = () => { }
        s.push(str)
        s.push(null)
        return s
    }

    getEventName(event: number) {
        return this.eventNames[event]
    }
}