'use strict';
// No packages required. Binary images are the only manually maintained asset source.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const configPath = path.join(root, 'js/config.js');
let config = fs.readFileSync(configPath, 'utf8');
const files = vm.runInNewContext(config.split('// BEGIN GENERATED ASSETS')[0] + '\nASSET_FILES');
const declarations = Object.entries(files).map(([name, file]) => {
  const bytes = fs.readFileSync(path.join(root, file));
  const png = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const webp = bytes.toString('ascii',0,4) === 'RIFF' && bytes.toString('ascii',8,12) === 'WEBP';
  if (!png && !webp) throw new Error('Unsupported image signature: ' + file);
  const mime = png ? 'image/png' : 'image/webp';
  if ((png && !file.endsWith('.png')) || (webp && !file.endsWith('.webp'))) throw new Error('Image extension/signature mismatch: ' + file);
  return `const ${name} = ${JSON.stringify('data:' + mime + ';base64,' + bytes.toString('base64'))};`;
}).join('\n');
config = config.replace(/(\/\/ BEGIN GENERATED ASSETS[^\n]*\n)[\s\S]*?(\/\/ END GENERATED ASSETS)/, (_,start,end) => start + declarations + '\n' + end);
fs.writeFileSync(configPath, config);
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (_, file) => '<style>\n' + fs.readFileSync(path.join(root,file),'utf8') + '</style>');
html = html.replace(/<script defer src="([^"]+)"><\/script>/g, (_, file) => '<script>\n' + fs.readFileSync(path.join(root,file),'utf8').replace(/<\/script/gi,'<\\/script') + '</script>');
fs.mkdirSync(path.join(root, 'dist'), {recursive:true});
fs.writeFileSync(path.join(root, 'dist/vessel-position-offline.html'), html);
console.log('Built dist/vessel-position-offline.html and regenerated config.js asset data URIs');
