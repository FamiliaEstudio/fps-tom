#include "../../../tom-lang/runtime/stable/numeric_buffer_internal.h"
#include <stdint.h>
#include <stdio.h>

int32_t fps_3d_compare(TomNumericBuffer *software, TomNumericBuffer *gpu,
                       uint32_t width, uint32_t height) {
    uint64_t count = (uint64_t)width * height;
    if (tom_numeric_buffer_length(software) != count || tom_numeric_buffer_length(gpu) != count)
        return TOM_INVALID;
    const unsigned char *a = tom_numeric_buffer_data(software);
    const unsigned char *b = tom_numeric_buffer_data(gpu);
    uint64_t different = 0;
    for (uint32_t y = 0; y < height; y++) for (uint32_t x = 0; x < width; x++) {
        const unsigned char *pixel = b + ((uint64_t)y * width + x) * 4;
        int found = 0;
        /* RGB ±2; nearest and triangle coverage may differ by one edge pixel. */
        for (int dy = -1; dy <= 1 && !found; dy++) for (int dx = -1; dx <= 1 && !found; dx++) {
            int64_t xx = (int64_t)x + dx, yy = (int64_t)y + dy;
            if (xx < 0 || yy < 0 || xx >= width || yy >= height) continue;
            const unsigned char *candidate = a + ((uint64_t)yy * width + (uint64_t)xx) * 4;
            int equal = 1;
            for (int c = 0; c < 3; c++) {
                int delta = (int)pixel[c] - (int)candidate[c];
                if (delta < -2 || delta > 2) equal = 0;
            }
            found = equal;
        }
        if (!found) different++;
    }
    if (different * 200 > count) {
        fprintf(stderr, "Cena3D: %llu/%llu pixels divergentes\n",
                (unsigned long long)different, (unsigned long long)count);
        return TOM_INVALID;
    }
    return TOM_OK;
}
