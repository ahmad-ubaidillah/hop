export class ExpressionEvaluator {
    evaluate(value, context) {
        if (!value || typeof value !== 'string')
            return value;
        value = value.trim();
        const num = Number(value);
        if (!isNaN(num) && value !== '')
            return num;
        if (value === 'true')
            return true;
        if (value === 'false')
            return false;
        if (value === 'null')
            return null;
        if (value === 'undefined')
            return undefined;
        return value;
    }
}
