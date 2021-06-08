<template>
    <div class="copy-url-page">
        <div class="field">
            <h3 class="title">URL</h3>
            <div class="input-container">
                <input type="text" id="url-input" :value="urlToCopy" readonly>
                <button class="copy-btn" @click="copyToClipboard">Copy</button>
            </div>
        </div>
    </div>
</template>


<style scoped>
.copy-url-page {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 100%;
}

.field {
    /* width: 700px; */
    border: 1px solid gray;
    padding: 10px;
    height: max-content;
    flex: 1;
    margin: 0 25%;
}

.field .title {
    margin: 0;
}

.input-container {
    display: flex;
    height: 30px;
}

#url-input {
    flex: 1;
    font-size: 12pt;
}

.copy-btn {
    width: 70px;
    margin-left: 10px;
}
</style>

<script lang="ts">
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator';
import ISandboxOptions from '@/other/ISandboxOptions';
import copy from 'copy-text-to-clipboard';

@Component
export default class CopyUrlPage extends Vue {
    @Prop({default: null})
    readonly options!: ISandboxOptions | null

    copyToClipboard() {
        copy(this.urlToCopy)
    }

    get urlToCopy() {
        let optionsValue = JSON.stringify(this.options)
        let basePath = location.protocol + "//" + location.host + this.$router.options.base
        return basePath + "?options=" + encodeURIComponent(optionsValue)
    }
}

</script>