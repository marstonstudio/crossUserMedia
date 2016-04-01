#include <stdio.h>
#include <emscripten.h>

static char *input_fmt;
static int input_sample_rate;
static char *output_fmt;
static int output_bit_rate;

int main(int argc, char **argv) {
    fprintf(stdout, "main\n");
    emscripten_exit_with_live_runtime();
}

void init(char *i_fmt, int i_sample_rate, char *o_fmt, int o_bit_rate) {
    fprintf(stdout, "input_fmt:%s, input_sample_rate:%d, output_format:%s, output_bit_rate:%d\n",
                     i_fmt, i_sample_rate, o_fmt, o_bit_rate);

    input_fmt = i_fmt;
    input_sample_rate = i_sample_rate;
    output_fmt = o_fmt;
    output_bit_rate = o_bit_rate;
}

void force_exit(int status) {
    fprintf(stdout, "force_exit (%d)\n", status);
    emscripten_force_exit(status);
}