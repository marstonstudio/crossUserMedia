
#Cygwin is a special case where the shell scripts have to be passed through `dos2unix` before execution
dos2unix build.sh setenv.sh
./build.sh
