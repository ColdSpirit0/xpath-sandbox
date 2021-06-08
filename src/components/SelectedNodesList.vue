<template>
<div class="selected-nodes-list">
    <h3 class="title">Selected nodes</h3>
    <div class="node-list" v-if="nodes.length > 0">
        <div class="node-item" v-for="(node, idx) of nodes" :key="idx">
            <span class="index">
                {{idx+1}}.
            </span>
            <span class="type">
                [{{node.type}}]
            </span>
            <span class="title">
                {{node.title.replace(/\n/g, "\\n")}} 
            </span>
        </div>
    </div>
    <div class="placeholder" v-else>Empty</div>
</div>
</template>

<style>

.selected-nodes-list .title {
    text-align: center;
}

.node-item {
    padding: 3px;
}

.node-item:nth-of-type(2n+1) {
    background: #202020;
}

.placeholder {
    text-align: center;
    color: gray;
}

.node-item .type {
    text-transform: capitalize;
    font-size: 10pt;
    color: #777777;
}
</style>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import INodeItem from "@/other/INodeItem"

@Component
export default class SelectedNodesList extends Vue {
    @Prop({ default: [] })
    nodes!: INodeItem[]
}
</script>