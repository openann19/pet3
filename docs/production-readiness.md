# Production Readiness Baseline (Nov 5, 2025)

The Configuration Unification Mandate requires initial telemetry for lint, type-check, test coverage, and security scans. Baseline runs have been captured for the web workspace to quantify current gaps.

## Baseline Metrics – Web

| Metric | Command | Result | Log |
| --- | --- | --- | --- |
| Lint Violations | `pnpm lint --report-unused-disable-directives` | 1,058 errors / 65 warnings | `logs/web-lint-baseline.log` |
| Type Errors | `pnpm type-check` | 55 TS errors (AnimatedStyle typings, verification DTO drift, unused symbols) | `logs/web-type-baseline.log` |
| Test Coverage | `pnpm test --coverage --reporter=json` | 69 failing suites / 44 failing tests, coverage ≈6.5% statements | `logs/web-test-baseline.json` |
| Security Audit | `pnpm audit --json` | Audit aborted (`ERR_PNPM_AUDIT_NO_LOCKFILE`; lockfile missing) | `logs/security-audit-baseline.json` |

### Observations

- **Lint:** Violations dominated by unsafe types (434), async misuse (356), and hook dependency issues (65). Legacy Spark access (`spark.kv`) still present in `community-seed-data.ts`.
- **Type-check:** 55 errors surfaced, dominated by React Native animated style incompatibilities and mismatched admin verification DTOs. tsconfig alignment plus domain model fixes required.
- **Tests:** Vitest now runs but 69 suites fail—23 suites abort during import analysis because JSX lives in `.ts` tests, and the remainder cluster around animation hooks/effects. Statement coverage is only ~6.5% (branches ~3.9%), so meaningful coverage work has not started.
- **Security:** `pnpm audit --json` cannot run because the repository is missing `pnpm-lock.yaml`, leaving dependency vulnerability posture unknown until the lockfile is restored.

## Next Steps

1. **Configuration Alignment:** Fix parserOptions/project paths and TS config inheritance so TypeScript diagnostics map correctly to packages.
2. **Service Remediation:** Target unsafe `any` usage and promise handling in web services/utilities to eliminate the top lint offenders.
3. **Testing Stabilization:** Repair JSX-bearing `.ts` tests (rename to `.tsx` or strip JSX) and triage animation hook/effect breakages to turn the 69 failing suites green.
4. **Security Review:** Restore `pnpm-lock.yaml`, rerun `pnpm audit --json`, and classify vulnerabilities once a valid report is produced.
5. **Extend Baselines:** Repeat the same capture for mobile and shared packages to complete Phase 1 deliverables.
