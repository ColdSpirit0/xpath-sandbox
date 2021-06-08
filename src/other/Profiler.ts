interface ProfilerItem {
    name: string
    start: number
}

export default class Profiler {
    static items: ProfilerItem[] = []

    static start(name: string) {
        this.items.push({
            name: name,
            start: performance.now()
        })

        this.log("Profiler: start " + name);
        
    }

    static log(...args: any[]) {
        let indentLevel = this.items.length - 1
        if (indentLevel > 0) {
            let indent = "\t".repeat(this.items.length-1)
            console.log(indent, ...args)
        }
        else {
            console.log(...args)
        }
    }

    static end(name: string) {
        for (let i = this.items.length-1; i >= 0; i--) {
            const item = this.items[i];
            if (item.name === name) {
                let end = performance.now()

                this.log("Profiler: end " + name);
                this.log(`🚀 [${name}]: ${end - item.start}`)

                this.items.splice(i, 1)
                return
            }
        }

        console.error(`No Profile.start for [${name}]`, this.items);
    }
}