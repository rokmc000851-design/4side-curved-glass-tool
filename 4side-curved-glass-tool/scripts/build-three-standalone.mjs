import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root=resolve(import.meta.dirname,'..');
const templatePath=resolve(root,'src/3d-template.html');
const entry=resolve(root,'src/three-renderer.js');
const output=resolve(root,'4side_curved_glass_3d_rendering_v1.html');
const geometry2DPath=resolve(root,'4side_curved_glass_design_tool_standalone_v20.html');
const unifiedOutput=resolve(root,'4side_curved_glass_tool_unified.html');

const result=await build({entryPoints:[entry],bundle:true,format:'iife',platform:'browser',target:['es2020'],minify:true,write:false,legalComments:'none'});
const bundle=result.outputFiles[0].text;
const template=await readFile(templatePath,'utf8');
const start=template.indexOf('<script>');
const end=template.lastIndexOf('</script>');
if(start<0||end<start)throw new Error('Template script block not found');
const html=template.slice(0,start)+`<script>\n${bundle}\n`+template.slice(end);
await writeFile(output,html,'utf8');
console.log(`Built ${output} (${html.length.toLocaleString()} characters)`);

const geometry2D=await readFile(geometry2DPath,'utf8');
const encode=value=>Buffer.from(value,'utf8').toString('base64');
const unified=`<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>4-Side Curved Display Design Tool</title>
<style>*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;font-family:Arial,'Noto Sans KR',sans-serif;background:#e9eef5}.shell{height:100%;display:flex;flex-direction:column}.tabs{height:46px;flex:none;display:flex;align-items:center;gap:7px;padding:6px 12px;background:#fff;border-bottom:1px solid #cbd5e1}.tabs strong{margin-right:12px;color:#162033}.tabs button{padding:8px 14px;border:1px solid #b8c2d0;border-radius:8px;background:#fff;color:#334155;font-weight:700;cursor:pointer}.tabs button.active{background:#2563eb;border-color:#2563eb;color:#fff}.stage{position:relative;flex:1;min-height:0}.stage iframe{position:absolute;inset:0;width:100%;height:100%;border:0;background:#fff}.stage iframe[hidden]{display:none}</style></head>
<body><div class="shell"><nav class="tabs"><strong>4-Side Curved Display</strong><button id="tab2d" class="active">2D Geometry</button><button id="tab3d">3D Rendering</button></nav><main class="stage"><iframe id="view2d" title="2D Geometry"></iframe><iframe id="view3d" title="3D Rendering" hidden></iframe></main></div>
<script>const source2d='${encode(geometry2D)}',source3d='${encode(html)}';const decode=value=>new TextDecoder().decode(Uint8Array.from(atob(value),c=>c.charCodeAt(0)));const view2d=document.getElementById('view2d'),view3d=document.getElementById('view3d'),tab2d=document.getElementById('tab2d'),tab3d=document.getElementById('tab3d');function show(mode){const is2d=mode==='2d';view2d.hidden=!is2d;view3d.hidden=is2d;tab2d.classList.toggle('active',is2d);tab3d.classList.toggle('active',!is2d);requestAnimationFrame(()=>{const frame=is2d?view2d:view3d;frame.contentWindow?.dispatchEvent(new Event('resize'))})}tab2d.onclick=()=>show('2d');tab3d.onclick=()=>show('3d');view2d.addEventListener('load',()=>{view3d.srcdoc=decode(source3d)},{once:true});view2d.srcdoc=decode(source2d);</script></body></html>`;
await writeFile(unifiedOutput,unified,'utf8');
console.log(`Built ${unifiedOutput} (${unified.length.toLocaleString()} characters)`);
