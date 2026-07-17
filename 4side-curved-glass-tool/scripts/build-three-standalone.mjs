import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root=resolve(import.meta.dirname,'..');
const templatePath=resolve(root,'src/3d-template.html');
const entry=resolve(root,'src/three-renderer.js');
const output=resolve(root,'4side_curved_glass_3d_rendering_v1.html');

const result=await build({entryPoints:[entry],bundle:true,format:'iife',platform:'browser',target:['es2020'],minify:true,write:false,legalComments:'none'});
const bundle=result.outputFiles[0].text;
const template=await readFile(templatePath,'utf8');
const start=template.indexOf('<script>');
const end=template.lastIndexOf('</script>');
if(start<0||end<start)throw new Error('Template script block not found');
const html=template.slice(0,start)+`<script>\n${bundle}\n`+template.slice(end);
await writeFile(output,html,'utf8');
console.log(`Built ${output} (${html.length.toLocaleString()} characters)`);
