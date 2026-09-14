import {defineConfig} from 'vite';
export default defineConfig({build:{outDir:'dist/module',lib:{entry:'src/game/module.ts',formats:['es'],fileName:'lumi-run'},emptyOutDir:true}});
