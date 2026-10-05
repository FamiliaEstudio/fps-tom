#include "../../../tom-lang/runtime/stable/tom_runtime.h"
#include <assert.h>
#include <math.h>

int32_t tom_audio_test_new(TomAudio **out);
int32_t tom_audio_test_render(TomAudio *audio,float *samples,int32_t frames);
static int64_t tv_start=-1;
static float first_left,first_right;

static int32_t advance(TomAudio *audio,int32_t frames) {
  float samples[512];int first=1;
  while(frames>0) {
    int32_t count=frames>256?256:frames;
    int32_t status=tom_audio_test_render(audio,samples,count);if(status)return status;
    if(first){first_left=samples[0];first_right=samples[1];first=0;}
    frames-=count;
  }
  return TOM_OK;
}
int32_t tom_fps_sync_new(TomAudio **out) {
  int32_t status=tom_audio_test_new(out);if(status)return status;
  status=tom_audio_pause(*out,0);if(status)return status;
  return advance(*out,137);
}
int32_t tom_fps_sync_sound(TomAudio *audio,TomSound *sound,int32_t channel,double gain,int32_t repeat) {
  if(channel==2){int32_t status=tom_audio_position(audio,&tv_start);if(status)return status;}
  int32_t status=tom_audio_sound(audio,sound,channel,gain,repeat);if(status)return status;
  /* Force an allowed callback interleaving after every immediate enqueue.
     A paused mixer cannot advance; the former TV setup loses its origin here. */
  return advance(audio,256);
}
int32_t tom_fps_sync_origin(TomAudio *audio,int64_t origin) {
  TomAudioClock clock;int32_t status=tom_audio_clock(audio,&clock);if(status)return status;
  assert(origin==tv_start&&clock.position>=origin);return TOM_OK;
}
int32_t tom_fps_sync_paused(TomAudio *audio,int32_t expected) {
  TomAudioClock clock;int32_t status=tom_audio_clock(audio,&clock);if(status)return status;
  assert(clock.paused==expected);return TOM_OK;
}
int32_t tom_fps_sync_advance(TomAudio *audio,int32_t frames,int64_t *out) {
  int32_t status=advance(audio,frames);return status?status:tom_audio_position(audio,out);
}
int32_t tom_fps_sync_sample(double expected) {
  assert(fabs(first_left-expected)<1e-6&&fabs(first_right-expected)<1e-6);return TOM_OK;
}
