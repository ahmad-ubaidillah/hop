export class BufferedLogger {
    logs = [];
    log(...args) {
        this.logs.push(`📝 ${args.join(' ')}`);
    }
    error(...args) {
        this.logs.push(`❌ ${args.join(' ')}`);
    }
    warn(...args) {
        this.logs.push(`⚠️  ${args.join(' ')}`);
    }
    getLogs() {
        return this.logs;
    }
    clear() {
        this.logs = [];
    }
    print() {
        for (const log of this.logs) {
            console.log(log);
        }
    }
}
