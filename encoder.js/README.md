Inspired by
* https://github.com/Kagami/ffmpeg.js
* https://github.com/fluent-ffmpeg/node-fluent-ffmpeg
* https://github.com/bgrins/videoconverter.js
* https://github.com/mattdiamond/Recorderjs
* http://qiita.com/ukyo/items/60b2e55f65eb525ce51c


cat input.wav | ffmpeg -i pipe:0 -f mp4 -movflags frag_keyframe+empty_moov pipe:1 | cat > stdout.mp4