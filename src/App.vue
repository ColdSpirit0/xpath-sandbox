<style src="@/assets/global.css"></style>
<template>
    <div id="app">
        <div class="header">
            <div id="nav">
                <router-link to="/">Sandbox</router-link> |
                <router-link to="/copy_url">Copy URL</router-link>
            </div>
            <div class="page-title">
                <h1>{{ $route.name }}</h1>
                <div class="links">
                    <a class="github" href="https://github.com/ColdSpirit0/xpath-sandbox" title="GitHub source"></a>
                </div>
            </div>
        </div>
        <div class="container">
            <router-view @cacheOptions="cacheOptions" :options="options" />
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import ISandboxOptions from "./other/ISandboxOptions";

@Component
export default class App extends Vue {
    options: ISandboxOptions | null = null

    cacheOptions(options: ISandboxOptions) {
        this.options = options
    }

    mounted() {
        // if "/" route not loaded, load it manually
        if (this.$route.path !== "/") {
            this.$router.push({ path: "/" })
        }
    }
}
</script>