export class JsonParser {
    extractJsonBody(text) {
        const match = text.match(/\{[\s\S]*\}/);
        if (!match)
            return null;
        try {
            return JSON.parse(match[0]);
        }
        catch {
            return null;
        }
    }
    parseGherkinJson(jsonStr) {
        try {
            return JSON.parse(jsonStr);
        }
        catch {
            return null;
        }
    }
}
