import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { OptimizedImagePipe } from '../pipes/optimized-image.pipe';
import { ResponsiveImageSrcsetPipe } from '../pipes/responsive-image-srcset.pipe';
import { TranslatePipe } from '../pipes/translate.pipe';

@NgModule({
  declarations: [TranslatePipe, OptimizedImagePipe, ResponsiveImageSrcsetPipe],
  imports: [CommonModule],
  exports: [TranslatePipe, OptimizedImagePipe, ResponsiveImageSrcsetPipe],
})
export class SharedModule {}
