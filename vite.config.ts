import { defineConfig } from 'vite';
import { resolve } from 'node:path';
export default defineConfig({build:{rollupOptions:{input:{main:resolve('index.html'),lessonA:resolve('lesson-a.html'),lessonB:resolve('lesson-b.html'),embed:resolve('embed.html')}}},server:{host:'0.0.0.0'}});
