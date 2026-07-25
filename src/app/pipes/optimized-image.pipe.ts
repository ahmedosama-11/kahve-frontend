import { Pipe, PipeTransform } from '@angular/core';
import { ImageOptimizationService } from '../services/image-optimization.service';

@Pipe({ name: 'kahveImage' })
export class OptimizedImagePipe implements PipeTransform {
  constructor(private imageOptimizationService: ImageOptimizationService) {}

  transform(url: string, width: number, height?: number): string {
    return this.imageOptimizationService.optimize(url, width, height);
  }
}
