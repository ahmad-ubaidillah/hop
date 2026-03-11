import type { Feature } from '../types/index.js';

export class TagFilter {
  /**
   * Filter features and scenarios by tags
   */
  public static filter(features: Feature[], tagExpression: string | undefined): Feature[] {
    if (!tagExpression) return features;
    
    const filterTags = tagExpression.replace(/@/g, '').split(',').map(t => t.trim());
    
    return features.map(feature => {
      // Check if feature has matching tags
      const featureHasMatchingTag = feature.tags && feature.tags.some(tag => filterTags.includes(tag));
      
      // Filter scenarios that have any matching tag OR scenarios from features with matching tags
      const filteredScenarios = feature.scenarios.filter(scenario => {
        // If scenario has tags, check for matches
        if (scenario.tags && scenario.tags.length > 0) {
          const scenarioHasMatch = scenario.tags.some(tag => filterTags.includes(tag));
          if (scenarioHasMatch) return true;
        }
        // If feature has matching tag, include all scenarios
        if (featureHasMatchingTag) return true;
        // Otherwise exclude
        return false;
      });
      
      return {
        ...feature,
        scenarios: filteredScenarios,
      };
    }).filter(feature => feature.scenarios.length > 0);
  }
}
