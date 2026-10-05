#include "../../../tom-lang/runtime/stable/ui_internal.h"
#include "../../../tom-lang/runtime/stable/numeric_buffer_internal.h"
#include <assert.h>
#include <stdio.h>
int32_t fps_compare_frame(TomWindow *window,TomNumericBuffer *pixels) {
  SDL_Surface *read=SDL_RenderReadPixels(window->renderer,NULL);assert(read);
  SDL_Surface *rgba=SDL_ConvertSurface(read,SDL_PIXELFORMAT_RGBA32);SDL_DestroySurface(read);assert(rgba);
  assert(rgba->w==320&&rgba->h==200&&tom_numeric_buffer_length(pixels)==64000);
  const unsigned char *gpu=tom_numeric_buffer_data(pixels);int different=0;
  // SDL software e Vulkan escolhem texels distintos em empates de nearest.
  // Aceitar um pixel de amostragem nas bordas de escala nearest.
  for(int y=0;y<200;y++)for(int x=0;x<320;x++) {
    const unsigned char *g=gpu+(y*320+x)*4;int found=0;
    for(int dy=-1;dy<=1&&!found;dy++)for(int dx=-1;dx<=1&&!found;dx++) {
      int yy=y+dy,xx=x+dx;if(yy<0||yy>=200||xx<0||xx>=320)continue;
      const unsigned char *s=(const unsigned char*)rgba->pixels+yy*rgba->pitch+xx*4;
      int equal=1;for(int c=0;c<3;c++)if((int)s[c]-(int)g[c]>2||(int)g[c]-(int)s[c]>2)equal=0;
      found=equal;
    }
    if(!found)different++;
  }
  SDL_DestroySurface(rgba);
  // Ate 0,5% de texels isolados de sprites alpha podem divergir na combinacao
  // de nearest e mistura. Geometria/oclusao tambem tem testes exatos separados.
  if(different>320)fprintf(stderr,"Pixels divergentes: %d / 64000\n",different);
  return different>320?TOM_INVALID:TOM_OK;
}
