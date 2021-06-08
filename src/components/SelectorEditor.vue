<style>
.cm-s-gruvbox-dark .CodeMirror-matchingbracket {
    background: unset !important;
    color: yellow !important;
    font-weight: bold !important;
}
</style>

<style scoped>
::v-deep .CodeMirror {
    font-size: 14pt;
    height: auto !important;
    border: 1px solid gray;
}
</style>
<template>
    <div class="editor">
        <codemirror 
            :options="options"
            :value="value"
            @input="$emit('input', $event)"
        />
    </div>
</template>

<script lang="ts">

// vue
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";

// codemirror
import { codemirror } from "vue-codemirror";
import "codemirror/mode/xquery/xquery";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/gruvbox-dark.css";
import "codemirror/addon/edit/matchbrackets";

@Component({components: { codemirror }})
export default class SelectorEditor extends Vue {
    @Prop({default: ""})
    value!:string

    options = {
        mode: "xquery",
        theme: "gruvbox-dark",
        height: 1,
        matchBrackets: true,
    }
}
</script>