## Summary
- What changed?
- Why is this needed?

## Release Gate Checklist
- [ ] `Quality Gate / verify` passed in CI
- [ ] `npm run verify:release` passed locally (or equivalent CI evidence)
- [ ] `THIRD_PARTY_NOTICES.md` regenerated when dependencies changed
- [ ] `Review Unresolved` is `없음` in `THIRD_PARTY_NOTICES.md`
- [ ] i18n coverage check passed (`npm run i18n:check`)

## Mobile Impact
- [ ] Android build/sync impact reviewed
- [ ] iOS build/sync impact reviewed
- [ ] No release signing/keystore secrets committed

## Notes for Reviewer
- Risk areas:
- Manual checks performed:
- Follow-up items:
