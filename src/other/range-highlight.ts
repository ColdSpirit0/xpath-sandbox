import CodeMirror, { MarkerRange } from "codemirror"
// import Profiler from "./Profiler"

let rangeData: MarkerRange[] = []
let markers: CodeMirror.TextMarker[] = []
CodeMirror.defineOption("highlightSelection", [], function (cm, val, old) {
    if (rangeData === val) return
    rangeData = val
    selectRanges(cm, rangeData)
})

function selectRanges(cm: CodeMirror.Editor, ranges: MarkerRange[]) {
    // Profiler.start("selectRanges")
    // clear previous marks
    markers.forEach(m => m.clear())
    markers = []

    // add new
    for (const range of ranges) {
        let marker = cm.markText(range.from, range.to, { className: "cm-marked" })
        markers.push(marker)
    }
    // Profiler.end("selectRanges")
}
