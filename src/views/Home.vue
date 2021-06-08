<style src="@/assets/home.css"></style>
<template>
    <div class="home">
        <div class="top-container">
            <div class="main-content">
                <div class="top-panel">
                    <div class="tools-panel">
                        <div class="tool">
                            <button @click="formatCode">Format code</button>
                        </div>
                        <div class="tool">
                            <label
                                for="useClass"
                                title='Replace class("") to contains(concat(" ", @class, " "), "  ")'
                            >
                                <input
                                    type="checkbox"
                                    name="useClass"
                                    id="useClass"
                                    v-model="useClassFunction"
                                />
                                Use "class()" function
                            </label>
                        </div>
                    </div>
                    <span class="note">[HTML mode only]</span>
                </div>

                <div class="field editor-field">
                    <label for="codeEditor">HTML source</label>
                    <codemirror
                        id="codeEditor"
                        ref="codeEditor"
                        :options="codeEditorOptions"
                        v-model="code"
                        @focus="setSelection([])"
                        @blur="updateSandbox(true)"
                    />
                    <spinner v-show="isLoading" />
                </div>

                <div class="error-msg" v-show="errorMsg">
                    <div class="icon">⚠</div>
                    <div class="description" v-text="errorMsg"></div>
                </div>
            </div>

            <div class="sidebar-wrapper">
                <div class="sidebar">
                    <div class="sidebar-content">
                        <selected-nodes-list :nodes="selectedNodes" />
                    </div>
                </div>
            </div>
        </div>

        <div class="selector-panel-container">
            <div class="selector-panel">
                <label for="textarea-source">Selector</label>

                <selector-editor id="selector-input" v-model="selector" />
            </div>
        </div>
    </div>
</template>



<script lang="ts">
// vue
import { Component, Vue, Watch, Prop } from "vue-property-decorator";
import "@/other/class-component-hooks";

// codemirror
import CodeMirror, { MarkerRange } from "codemirror";
import { codemirror } from "vue-codemirror";
import "codemirror/mode/javascript/javascript";
import "codemirror/mode/css/css";
import "codemirror/mode/htmlmixed/htmlmixed";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/gruvbox-dark.css";
import emmet from "@emmetio/codemirror-plugin";
import "@/other/range-highlight";
emmet(CodeMirror);

// xpath parser
import xpath from "xpath";

// posthtml
import posthtml from "posthtml";
import beautify from "posthtml-beautify";

// custom compontens
import SelectedNodesList from "@/components/SelectedNodesList";
import SelectorEditor from "@/components/SelectorEditor";
import Spinner from "@/components/Spinner";

// parser
import DOMBuilder, { XmldomNode } from "@/XmlParser/DomBuilder";
import SaxWasm from "@/XmlParser/SaxWasm";
import { NodeType } from "@/XmlParser/SandboxNode";
import { Tag, Text as SW_Text, Position, Attribute } from "sax-wasm";
import INodeItem from "@/other/INodeItem";

// other
import htmlExamples from "@/other/examples";
import ISandboxOptions from "@/other/ISandboxOptions";
import sleep from "@/other/sleep";
// import Profiler from "@/other/Profiler"



@Component({
    components: { codemirror, SelectedNodesList, SelectorEditor, Spinner },
})
export default class Home extends Vue {
    @Prop({ default: null })
    readonly options!: ISandboxOptions | null;

    initialized = false;
    selectionRanges: MarkerRange[] = [];

    cachedDom?: XMLDocument;

    useClassFunction = true;

    code = htmlExamples[0];
    // selector = `//a | //div | //svg`;
    selector = `//*[class("greetings")] | //a/text() | //a/@href`;
    selectedFor = "";

    sax = new SaxWasm();

    errorMsg = "";

    selectedNodes: INodeItem[] = [];

    shouldUpdateDom = true;

    codeEditorOptions = {
        tabSize: 2,
        mode: "htmlmixed",
        lineNumbers: true,
        theme: "gruvbox-dark",
        extraKeys: {
            Tab: "emmetExpandAbbreviation",
            Esc: "emmetResetAbbreviation",
            Enter: "emmetInsertLineBreak",
        },
    };

    loadingLevel = 0;

    get isLoading() {
        return this.loadingLevel > 0;
    }

    setLoading(value: boolean) {
        // getter/setter are not update the page
        if (value) {
            this.loadingLevel++;
        } else {
            this.loadingLevel--;
        }

        // this.isLoading = this.loadingLevel > 0
        this.editor.setOption("readOnly", this.isLoading);
    }

    async formatCode(reevaluateSelector = true) {
        this.setLoading(true);
        let result = await posthtml([
            beautify({
                rules: {
                    indent: 2,
                    // blankLines: "",
                    eof: false,
                },
            }),
        ]).process(this.code);
        this.code = result.html;

        if (reevaluateSelector) {
            await this.updateSandbox(true);
        }

        this.setLoading(false);
    }

    async updateSandbox(force = false) {
        this.errorMsg = "";

        let selector = this.selector.trim();

        // if already selected
        if (!force && this.selectedFor === selector) {
            return;
        }

        // replace class() if needed
        if (this.useClassFunction) {
            selector = selector.replaceAll(
                /class\("(.+?)"\)/g,
                `contains(concat(" ", @class, " "), " $1 ")`
            );
        }

        // Profiler.start("updateSandbox")

        this.setLoading(true);
        await sleep(0); // spinner hack

        let result: Iterable<XmldomNode> = [];

        // check for empty selector
        if (selector !== "") {
            // parse code
            if (this.shouldUpdateDom) {
                // Profiler.start("updateDOM")
                let dom = new DOMBuilder();
                await this.sax.init();
                await this.sax.run(this.code, dom);
                try {
                    this.cachedDom = dom.asXmldom();
                } catch (error) {
                    this.errorMsg = error
                }
                this.shouldUpdateDom = false;
                // Profiler.end("updateDOM")
            }

            result = await this.evaluateSelector(selector);
        }

        await this.highlightSelected(result);
        this.selectedFor = selector;
        this.setLoading(false);
        // Profiler.end("updateSandbox")
    }

    async evaluateSelector(selector: string): Promise<Iterable<XmldomNode>> {
        // Profiler.start("evaluateSelector")
        this.setLoading(true);

        let result: Iterable<XmldomNode> = [];

        try {
            // xpath
            if (selector.startsWith("/") || selector.startsWith("(")) {
                result = xpath.select(selector, this.cachedDom) as Node[];
            }

            // css
            else {
                result = this.cachedDom!.querySelectorAll(selector);
            }
        } catch (error) {
            this.errorMsg = error + "\nComputed selector: " + selector;
            // console.error(error);
        }

        this.setLoading(false);
        // Profiler.end("evaluateSelector")
        return result;
    }

    setSelection(selection: MarkerRange[]) {
        // @ts-ignore
        this.editor.setOption("highlightSelection", selection);
    }

    async highlightSelected(selected: Iterable<XmldomNode>) {
        // clear ranges
        this.selectionRanges = [];
        this.selectedNodes = [];

        // is iterable
        if (!(Symbol.iterator in Object(selected))) {
            this.selectedNodes.push({
                title: String(selected),
                type: "unknown",
            });
            return;
        }

        // Profiler.start("highlightSelected")
        this.setLoading(true);

        // extract ranges
        for (const node of selected) {
            let sbNode = node.sandboxNode!;

            // if text, just select text
            if (sbNode.nodeType === NodeType.TEXT_NODE) {
                let parsingData = sbNode.parsingData! as SW_Text;
                this.selectionRanges.push(
                    this.toMarkerRange(parsingData.start, parsingData.end)
                );

                this.selectedNodes.push({
                    title: parsingData.value,
                    type: "text",
                });
            }

            // if element
            else if (sbNode.nodeType === NodeType.ELEMENT_NODE) {
                let parsingData = sbNode.parsingData! as Tag;
                this.selectedNodes.push({
                    title: parsingData.name,
                    type: "element",
                });

                // if self-closed - one range, else two ranges
                if (sbNode.isSelfClosing) {
                    this.selectionRanges.push(
                        this.toMarkerRange(
                            parsingData.openStart,
                            parsingData.openEnd
                        )
                    );
                } else {
                    this.selectionRanges.push(
                        this.toMarkerRange(
                            parsingData.openStart,
                            parsingData.openEnd
                        )
                    );

                    this.selectionRanges.push(
                        this.toMarkerRange(
                            parsingData.closeStart,
                            parsingData.closeEnd
                        )
                    );
                }
            }

            // if attribute
            else if (sbNode.nodeType === NodeType.ATTRIBUTE_NODE) {
                let parsingData = sbNode.parsingData! as Attribute;
                this.selectedNodes.push({
                    title: parsingData.name.value,
                    type: "attribute",
                });

                this.selectionRanges.push(
                    this.toMarkerRange(
                        parsingData.name.start,
                        parsingData.name.end
                    )
                );
            }

            // if document
            else if (sbNode.nodeType === NodeType.DOCUMENT_NODE) {
                // nothing to highlight
                this.selectedNodes.push({
                    title: "Document",
                    type: "document",
                });
            }

            // ???
            else {
                throw new Error(`Unknown node type: ${sbNode.nodeType}`);
            }
        }

        this.setSelection(this.selectionRanges);
        this.setLoading(false);

        // Profiler.end("highlightSelected")
    }

    toMarkerRange(from: Position, to: Position): MarkerRange {
        return {
            from: { line: from.line, ch: from.character },
            to: { line: to.line, ch: to.character },
        };
    }

    async mounted() {
        let options = this.options || this.urlOptions;
        if (options !== null) {
            if (options.useClassFunction !== undefined) {
                this.useClassFunction = options.useClassFunction;
            }

            if (options.html !== undefined) {
                this.code = options.html;
            }

            if (options.selector !== undefined) {
                this.selector = options.selector;
            }

            if (options.format !== undefined) {
                await this.formatCode(false);
            }
        }

        await this.updateSandbox();
        this.$router.replace("/").catch(() => {});
        this.initialized = true;
    }

    get editor(): CodeMirror.Editor {
        return (this.$refs["codeEditor"] as any).codemirror;
    }

    get urlOptions(): ISandboxOptions | null {
        let opts = this.$route.query.options;

        let obj;
        let ok = true;

        if (typeof opts === "string") {
            try {
                console.log(opts);
                obj = JSON.parse(opts!);
            } catch (error) {
                ok = false;
            }
        } else {
            ok = false;
        }

        if (ok) {
            return obj;
        } else {
            this.errorMsg = "Invalid options parameter in URL";
        }
        return null;
    }

    @Watch("selector")
    onSelectorChange(nv: string, ov: string) {
        if (!this.initialized) return;
        this.updateSandbox();
    }

    @Watch("code")
    onCodeChange(nv: string, ov: string) {
        if (nv.trim() === ov.trim()) return;
        this.shouldUpdateDom = true;
    }

    @Watch("useClassFunction")
    onUseClassFunctionChange() {
        if (!this.initialized) return;
        this.updateSandbox(true);
    }

    beforeRouteLeave(to: any, from: any, next: any) {
        let data: ISandboxOptions = {
            html: this.code,
            selector: this.selector,
            useClassFunction: this.useClassFunction,
        };

        this.$emit("cacheOptions", data);
        next();
    }
}
</script>

