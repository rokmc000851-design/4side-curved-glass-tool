import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, normalize, resolve } from "node:path";

const root = process.cwd();
const htmlPath = join(root, "index.html");
const cssPath = join(root, "src/css/style.css");
const appPath = join(root, "src/js/app.js");
const outputPath = join(root, "dist/4side_curved_glass_design_tool.html");

const importPattern = /^\s*import\s+[^'"]+['"](.+)['"];\s*$/gm;
const visited = new Set();
const bundledFiles = [];

async function collectModule(filePath) {
  const normalizedPath = normalize(filePath);
  if (visited.has(normalizedPath)) {
    return;
  }
  visited.add(normalizedPath);

  const source = await readFile(normalizedPath, "utf8");
  const dir = dirname(normalizedPath);
  const imports = [...source.matchAll(importPattern)].map((match) => match[1]);

  for (const importPath of imports) {
    const childPath = resolve(dir, importPath);
    if (!childPath.startsWith(root)) {
      throw new Error(`Import outside project root is not allowed: ${importPath}`);
    }
    await collectModule(childPath);
  }

  bundledFiles.push({ filePath: normalizedPath, source });
}

function transformModuleSource(source) {
  return source
    .replace(importPattern, "")
    .replace(/^\s*export\s+const\s+/gm, "const ")
    .replace(/^\s*export\s+function\s+/gm, "function ")
    .replace(/^\s*export\s+\{[^}]+\};?\s*$/gm, "");
}

async function build() {
  let html = await readFile(htmlPath, "utf8");
  const css = await readFile(cssPath, "utf8");
  await collectModule(appPath);
  const app = bundledFiles
    .map((module) => `// ${module.filePath.replace(`${root}\\`, "")}\n${transformModuleSource(module.source)}`)
    .join("\n\n");

  html = html.replace('<link rel="stylesheet" href="./src/css/style.css">', `<style>\n${css}\n</style>`);
  html = html.replace('<script type="module" src="./src/js/app.js"></script>', `<script type="module">\n${app}\n</script>`);

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, html, "utf8");
  console.log(`Built ${outputPath}`);
}

build();
