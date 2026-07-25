import { Pipe, PipeTransform } from '@angular/core';
import { ImageOptimizationService } from '../services/image-optimization.service';

@Pipe({ name: 'kahveSrcset' })
export class ResponsiveImageSrcsetPipe implements PipeTransform {
  constructor(private imageOptimizationService: ImageOptimizationService) {}

  transform(url: string, preset: 'hero' | 'story' | 'product'): string {
    if (preset === 'hero') {
      return this.imageOptimizationService.srcset(url, [480, 640, 960, 1200, 1440]);
    }

    if (preset === 'story') {
      return this.imageOptimizationService.srcset(url, [480, 800, 1200]);
    }

    return this.imageOptimizationService.srcset(url, [240, 320, 480, 640], 1);
  }
}
