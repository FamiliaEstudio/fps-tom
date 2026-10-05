#include "../../../tom-lang/runtime/stable/ui_internal.h"
#include "../../../tom-lang/runtime/stable/numeric_buffer_internal.h"
#include <assert.h>
#include <stdio.h>
#include <stdlib.h>
int32_t fps_campaign3d_compare(TomWindow *window,TomNumericBuffer *pixels) {
  SDL_Surface *read=SDL_RenderReadPixels(window->renderer,NULL);assert(read);
  SDL_Surface *rgba=SDL_ConvertSurface(read,SDL_PIXELFORMAT_RGBA32);SDL_DestroySurface(read);assert(rgba);
  assert(rgba->w==320&&rgba->h==200&&tom_numeric_buffer_length(pixels)==64000);
  const unsigned char *gpu=tom_numeric_buffer_data(pixels);int different=0, minimap=0, bottom=0;
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
    if(!found){different++;if(x>=247&&y>=4&&y<72)minimap++;if(y>=176)bottom++;}
  }
  const char *prefix=getenv("FPS_CAMPAIGN_IMAGES");
  if(prefix) {
    char name[4096];SDL_snprintf(name,sizeof(name),"%s-sdl.png",prefix);
    SDL_SavePNG(rgba,name);
    SDL_Surface *gpuImage=SDL_CreateSurfaceFrom(320,200,SDL_PIXELFORMAT_RGBA32,(void*)gpu,320*4);
    if(gpuImage){SDL_snprintf(name,sizeof(name),"%s-gpu.png",prefix);SDL_SavePNG(gpuImage,name);SDL_DestroySurface(gpuImage);}
  }
  SDL_DestroySurface(rgba);
  // Ate 0,5% de texels isolados de sprites alpha podem divergir na combinacao
  // de nearest e mistura. Geometria/oclusao tambem tem testes exatos separados.
  if(different>320)fprintf(stderr,"Pixels divergentes: %d / 64000 (minimapa=%d, hud=%d)\n",different,minimap,bottom);
  return different>320?TOM_INVALID:TOM_OK;
}

int32_t fps_campaign3d_grouped_compare(TomNumericBuffer *immediate,TomNumericBuffer *grouped) {
    int32_t status=tom_numeric_buffer_validate(immediate,2,0);if(status)return status;
    status=tom_numeric_buffer_validate(grouped,2,0);if(status)return status;
    uint64_t count=tom_numeric_buffer_length(immediate);
    if(count!=tom_numeric_buffer_length(grouped))return TOM_BOUNDS;
    const uint32_t *a=(const uint32_t*)tom_numeric_buffer_data(immediate),*b=(const uint32_t*)tom_numeric_buffer_data(grouped);
    for(uint64_t i=0;i<count;i++)if(a[i]!=b[i]) {
        fprintf(stderr,"Campanha agrupada: pixel %llu = %08x, imediato %08x\n",(unsigned long long)i,b[i],a[i]);return TOM_INVALID;
    }
    return TOM_OK;
}
