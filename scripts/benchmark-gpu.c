/* Benchmark-only instrumentation: count every native submission, including
   synchronous resize/initialization that has no public TomGPUJob. The runtime
   itself is compiled unchanged, with these two SDL names redirected. */
#include "../../../tom-lang/runtime/stable/gpu_internal.h"
#undef SDL_SubmitGPUCommandBufferAndAcquireFence
#undef SDL_ReleaseGPUFence
extern SDL_GPUFence *SDLCALL SDL_SubmitGPUCommandBufferAndAcquireFence(SDL_GPUCommandBuffer *);
extern void SDLCALL SDL_ReleaseGPUFence(SDL_GPUDevice *,SDL_GPUFence *);
typedef struct TomBenchmarkGPUStats {uint64_t submissions,measured,duration_ns;} TomBenchmarkGPUStats;
static TomBenchmarkGPUStats totals;
SDL_GPUFence *SDLCALL tom_benchmark_submit(SDL_GPUCommandBuffer *command) {
  SDL_GPUFence *fence=SDL_SubmitGPUCommandBufferAndAcquireFence(command);
  if(fence)totals.submissions=tom_gpu_saturating_add(totals.submissions,1);return fence;
}
void SDLCALL tom_benchmark_release_fence(SDL_GPUDevice *device,SDL_GPUFence *fence) {
  const TomSDLTimestampAPI *api=SDL_GetPointerProperty(SDL_GetGPUDeviceProperties(device),TOM_SDL_TIMESTAMP_PROPERTY,NULL);
  uint64_t values[2],ns=0;
  if(api&&api->version==1&&api->read&&api->read(api->context,fence,values)&&
    tom_gpu_timestamp_ns(values[0],values[1],api->valid_bits,api->period_ns,&ns)==TOM_OK) {
    totals.measured=tom_gpu_saturating_add(totals.measured,1);
    totals.duration_ns=tom_gpu_saturating_add(totals.duration_ns,ns);
  }
  SDL_ReleaseGPUFence(device,fence);
}
int32_t tom_benchmark_gpu_profile(TomBenchmarkGPUStats *out) {
  if(!out)return TOM_INVALID;*out=totals;return TOM_OK;
}
