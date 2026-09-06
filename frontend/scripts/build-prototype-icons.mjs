import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const frontendRoot = resolve(scriptDir, '..')
const prototypeDirs = [
  join(frontendRoot, 'public/prototype'),
  join(frontendRoot, 'public/prototype-adviser'),
]
const iconDir = join(
  frontendRoot,
  'node_modules/lucide-react/dist/esm/icons',
)

// Keep this list aligned with the HTML sources routed in src/main.tsx. An
// explicit list prevents ignored local prototypes from changing generated
// output and keeps clean-clone builds deterministic.
const htmlFiles = [
  join(prototypeDirs[0], 'client_ui.html'),
  join(prototypeDirs[0], 'client_requests_ui.html'),
  join(prototypeDirs[0], 'client_documents.html'),
  join(prototypeDirs[0], 'client_consent.html'),
  join(prototypeDirs[0], 'client_change_bank_prot1.html'),
  join(prototypeDirs[0], 'client_report.html'),
  join(prototypeDirs[1], 'adviser_ui.html'),
  join(prototypeDirs[1], 'adviser_inbox.html'),
  join(prototypeDirs[1], 'adviser_clients.html'),
]

const iconNames = new Set()
for (const htmlFile of htmlFiles) {
  const html = readFileSync(htmlFile, 'utf8')
  for (const match of html.matchAll(/data-lucide="([^"]+)"/g)) {
    if (/^[a-z0-9-]+$/.test(match[1])) iconNames.add(match[1])
  }
}

const icons = {}
for (const iconName of [...iconNames].sort()) {
  let modulePath = join(iconDir, `${iconName}.mjs`)
  if (!existsSync(modulePath)) {
    throw new Error(`Lucide icon module not found: ${iconName}`)
  }

  let source = readFileSync(modulePath, 'utf8')
  const aliasMatch = source.match(/export \{ default \} from '\.\/([^']+)'/)
  if (aliasMatch) {
    modulePath = join(iconDir, aliasMatch[1])
    source = readFileSync(modulePath, 'utf8')
  }
  const nodeMatch = source.match(/const __iconNode = (\[[\s\S]*?\]);/)
  if (!nodeMatch) throw new Error(`Could not read icon nodes: ${iconName}`)
  icons[iconName] = Function(`"use strict"; return (${nodeMatch[1]})`)()
}

const runtime = `/* Generated from the installed lucide-react package. Do not edit by hand. */
(() => {
  const icons = ${JSON.stringify(icons)};
  const namespace = "http://www.w3.org/2000/svg";

  function createIcons() {
    document.querySelectorAll("[data-lucide]").forEach((placeholder) => {
      const name = placeholder.getAttribute("data-lucide");
      const nodes = icons[name];
      if (!nodes) return;

      const svg = document.createElementNS(namespace, "svg");
      for (const attribute of placeholder.attributes) {
        if (attribute.name !== "data-lucide") svg.setAttribute(attribute.name, attribute.value);
      }
      svg.setAttribute("xmlns", namespace);
      svg.setAttribute("width", svg.getAttribute("width") || "24");
      svg.setAttribute("height", svg.getAttribute("height") || "24");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("fill", "none");
      svg.setAttribute("stroke", "currentColor");
      svg.setAttribute("stroke-width", "2");
      svg.setAttribute("stroke-linecap", "round");
      svg.setAttribute("stroke-linejoin", "round");
      svg.setAttribute("aria-hidden", "true");
      svg.classList.add("lucide", "lucide-" + name);

      for (const [tag, attributes] of nodes) {
        const child = document.createElementNS(namespace, tag);
        for (const [key, value] of Object.entries(attributes)) {
          if (key !== "key") child.setAttribute(key, value);
        }
        svg.appendChild(child);
      }
      placeholder.replaceWith(svg);
    });
  }

  window.lucide = { createIcons };
})();
`

const outputs = [
  join(prototypeDirs[0], 'lucide-local.js'),
]

for (const output of outputs) {
  mkdirSync(dirname(output), { recursive: true })
  writeFileSync(output, runtime)
  console.log(`Wrote ${output} (${iconNames.size} icons)`)
}
