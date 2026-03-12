import type { Feature } from '../types/index.js';

export class TagFilter {
  /**
   * Filter features and scenarios by tags
   */
  public static filter(features: Feature[], tagExpression: string | undefined): Feature[] {
    if (!tagExpression || tagExpression.trim() === '') return features;
    
    const expressions = tagExpression.split(',').map(e => e.trim());
    
    return features.map(feature => {
      const filteredScenarios = feature.scenarios.filter(scenario => {
        const scenarioTags = (scenario.tags || []).concat(feature.tags || []);
        
        return expressions.every(expr => {
          if (expr.toLowerCase().startsWith('not ')) {
            const forbiddenTag = expr.substring(4).replace(/^@/, '').trim();
            return !scenarioTags.includes(forbiddenTag);
          } else {
            const requiredTag = expr.replace(/^@/, '').trim();
            return scenarioTags.includes(requiredTag);
          }
        });
      });
      
      return {
        ...feature,
        scenarios: filteredScenarios,
      };
    }).filter(feature => feature.scenarios.length > 0);
  }
}
