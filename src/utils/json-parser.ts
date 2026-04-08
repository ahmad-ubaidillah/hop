export class JsonParser {
  extractJsonBody(text: string): any {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }

  parseGherkinJson(jsonStr: string): any {
    try {
      return JSON.parse(jsonStr);
    } catch {
      return null;
    }
  }
}
