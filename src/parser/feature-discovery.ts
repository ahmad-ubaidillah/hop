import { readdir, stat } from 'fs/promises';
import { join, extname } from 'path';

export class FeatureDiscovery {
  public async discover(featuresPath: string): Promise<string[]> {
    const featureFiles: string[] = [];
    try {
      const stats = await stat(featuresPath);
      if (stats.isFile()) {
        return extname(featuresPath) === '.feature' ? [featuresPath] : [];
      }
      const entries = await readdir(featuresPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(featuresPath, entry.name);
        if (entry.isDirectory()) {
          featureFiles.push(...(await this.discover(fullPath)));
        } else if (entry.isFile() && extname(entry.name) === '.feature') {
          featureFiles.push(fullPath);
        }
      }
    } catch (error) {
      throw new Error(`Failed to read features directory: ${featuresPath}`);
    }
    return featureFiles;
  }
}
