#!/usr/bin/env tsx
/**
 * Mobile Prop Parity Checker (ts-morph)
 * 
 * Checks that all web components have corresponding .native.tsx files
 * and verifies exported component name and destructured prop key parity.
 * 
 * Usage: ts-node scripts/check-mobile-parity.ts
 */

import { Project, SyntaxKind, SourceFile, Node } from 'ts-morph'
import { globby } from 'globby'
import * as path from 'node:path'

const WEB_ROOT = 'apps/web/src/components'
const MOB_ROOT = 'apps/mobile/src/components'

const project = new Project({ tsConfigFilePath: 'tsconfig.json' })

function getExportedComponentName(sf: SourceFile): string | null {
  // Prefer first exported function with PascalCase name
  const exports = sf.getExportedDeclarations()
  for (const [name, decs] of exports) {
    for (const d of decs) {
      if (Node.isFunctionDeclaration(d) || Node.isVariableDeclaration(d)) {
        const nm = name || (Node.isFunctionDeclaration(d) ? d.getName() : d.getName())
        if (nm && /^[A-Z]/.test(nm)) return nm
      }
    }
  }
  // default export fallback: try to infer identifier
  const def = sf.getDefaultExportSymbol()
  if (def) {
    const decl = def.getDeclarations()[0]
    if (Node.isFunctionDeclaration(decl) && decl.getName()) return decl.getName()!
  }
  return null
}

function getDestructuredPropKeys(sf: SourceFile, compName: string): string[] {
  // Find the exported function component and read its first parameter destructuring keys
  const funcs = sf.getFunctions().filter(f => f.isExported() || f.isDefaultExport() || f.getName() === compName)
  const vars  = sf.getVariableDeclarations().filter(v => v.isExported() || v.getName() === compName)
  const candidates = [...funcs.map(f => f), ...vars.map(v => v)]
  for (const c of candidates) {
    // Function form
    if (Node.isFunctionDeclaration(c)) {
      const p = c.getParameters()[0]
      if (!p) continue
      const binding = p.getBindingPattern()
      if (binding) {
        return binding.getElements().map(el => el.getNameNode().getText())
      }
      // If typed param without destructuring, skip (cannot infer easily)
    }
    // const Comp = ({ x, y }: Props) => ...
    if (Node.isVariableDeclaration(c)) {
      const init = c.getInitializer()
      if (!init) continue
      const arrow = init.getFirstDescendantByKind(SyntaxKind.ArrowFunction)
      if (!arrow) continue
      const p = arrow.getParameters()[0]
      if (!p) continue
      const binding = p.getBindingPattern()
      if (binding) {
        return binding.getElements().map(el => el.getNameNode().getText())
      }
    }
  }
  return []
}

function nativePathFor(webPath: string): string {
  const rel = path.relative(WEB_ROOT, webPath)
  const out = path.join(MOB_ROOT, rel).replace(/\.tsx$/, '.native.tsx')
  return out
}

async function main(): Promise<void> {
  const webFiles = await globby(`${WEB_ROOT}/**/[A-Z]*.tsx`, {
    ignore: ['**/*.native.tsx', '**/*.stories.tsx', '**/*.test.tsx'],
  })

  let failures = 0

  for (const wf of webFiles) {
    const native = nativePathFor(wf)
    const web = project.addSourceFileAtPathIfExists(wf)
    const mob = project.addSourceFileAtPathIfExists(native)

    if (!mob) {
      console.error(`❌ Missing mobile file for: ${path.relative(process.cwd(), wf)} -> ${native}`)
      failures++
      continue
    }

    if (!web) {
      console.error(`❌ Cannot read web file: ${wf}`)
      failures++
      continue
    }

    const webName = getExportedComponentName(web)
    const mobName = getExportedComponentName(mob)
    if (!webName || !mobName) {
      console.error(`❌ Cannot determine export names: ${wf} / ${native}`)
      failures++
      continue
    }
    if (webName !== mobName) {
      console.error(`❌ Export name mismatch: ${path.basename(wf)} exports "${webName}" but native has "${mobName}"`)
      failures++
    }

    // Compare destructured props (order-insensitive)
    const webKeys = new Set(getDestructuredPropKeys(web, webName))
    const mobKeys = new Set(getDestructuredPropKeys(mob, mobName))

    // Only validate when both sides destructure (non-empty)
    if (webKeys.size && mobKeys.size) {
      const aOnly = [...webKeys].filter(k => !mobKeys.has(k))
      const bOnly = [...mobKeys].filter(k => !webKeys.has(k))
      if (aOnly.length || bOnly.length) {
        console.error(`❌ Prop key mismatch for ${webName}:\n  Web-only: ${aOnly.join(', ') || '—'}\n  Mobile-only: ${bOnly.join(', ') || '—'}`)
        failures++
      }
    }
  }

  if (failures) {
    console.error(`\n⛔ Mobile parity check failed with ${failures} issue(s).`)
    process.exit(1)
  }
  console.log('✅ Mobile parity OK (files + names + destructured prop keys)')
}

main().catch((e) => { 
  console.error(e)
  process.exit(1)
})
