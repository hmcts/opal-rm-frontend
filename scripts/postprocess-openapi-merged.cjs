const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');

const CONFIG_PATH = path.resolve(__dirname, '../openapi/openapi-merge-config.json');
const MERGED_FILE = path.resolve(__dirname, '../openapi/opal-merged.yaml');

const mergeConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

const fileSuffixMap = {};
for (const input of mergeConfig.inputs) {
  const fileName = path.basename(input.inputURL);
  fileSuffixMap[fileName] = input.dispute.suffix || '';
}

const parsed = yaml.load(fs.readFileSync(MERGED_FILE, 'utf8'));
parsed.openapi = '3.1.0';

function rewriteRefs(value) {
  if (typeof value !== 'object' || value === null) return;

  for (const [key, child] of Object.entries(value)) {
    if (key === '$ref' && typeof child === 'string') {
      const match = new RegExp(/^\.\/([^/]+)#\/components\/(\w+)\/(.+)$/).exec(child);

      if (!match) continue;

      const [, fileName, componentType, originalName] = match;
      const suffix = fileSuffixMap[fileName];

      if (!suffix) continue;

      value[key] = `#/components/${componentType}/${originalName}${suffix}`;
      continue;
    }

    rewriteRefs(child);
  }
}

rewriteRefs(parsed);
fs.writeFileSync(MERGED_FILE, yaml.dump(parsed, { noRefs: true }), 'utf8');

console.log(`Updated OpenAPI refs in ${MERGED_FILE}`);
