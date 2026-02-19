import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const packageLockPath = resolve(root, 'package-lock.json');
const policyPath = resolve(root, 'license-policy.json');
const approvalsPath = resolve(root, 'license-review-approvals.json');
const noticesPath = resolve(root, 'THIRD_PARTY_NOTICES.md');

const packageLock = JSON.parse(readFileSync(packageLockPath, 'utf8'));
const policy = JSON.parse(readFileSync(policyPath, 'utf8'));
const approvalsConfig = JSON.parse(readFileSync(approvalsPath, 'utf8'));

const forbiddenPatterns = (policy.forbiddenLicensePatterns || []).map((v) => String(v));
const reviewPatterns = (policy.reviewRequiredLicensePatterns || []).map((v) => String(v));
const approvalItems = Array.isArray(approvalsConfig.approvals) ? approvalsConfig.approvals : [];
const approvalMap = new Map(approvalItems.map((item) => [String(item.package), item]));

const entries = [];
const packages = packageLock.packages || {};

for (const [key, meta] of Object.entries(packages)) {
  if (!key || !key.startsWith('node_modules/')) continue;
  const name = key.replace(/^node_modules\//, '');
  const version = meta.version || 'unknown';
  const license = String(meta.license || meta.licenses || 'UNKNOWN');
  const repository = meta.repository
    ? (typeof meta.repository === 'string' ? meta.repository : (meta.repository.url || ''))
    : '';

  const forbiddenHits = forbiddenPatterns.filter((pattern) => license.toUpperCase().includes(pattern.toUpperCase()));
  const reviewHits = reviewPatterns.filter((pattern) => license.toUpperCase().includes(pattern.toUpperCase()));

  entries.push({
    name,
    version,
    license,
    repository,
    forbiddenHits,
    reviewHits
  });
}

entries.sort((a, b) => a.name.localeCompare(b.name));

const licenseCount = new Map();
for (const entry of entries) {
  licenseCount.set(entry.license, (licenseCount.get(entry.license) || 0) + 1);
}

const forbiddenList = entries.filter((entry) => entry.forbiddenHits.length > 0);
const reviewList = entries.filter((entry) => entry.reviewHits.length > 0);
const approvedReviewList = [];
const unresolvedReviewList = [];

for (const entry of reviewList) {
  const key = `${entry.name}@${entry.version}`;
  const approval = approvalMap.get(key);
  if (approval) {
    approvedReviewList.push({ entry, approval });
  } else {
    unresolvedReviewList.push(entry);
  }
}

const summaryLines = [...licenseCount.entries()]
  .sort((a, b) => b[1] - a[1])
  .map(([license, count]) => `- ${license}: ${count}`)
  .join('\n');

const reviewSection = reviewList.length
  ? reviewList
      .map((entry) => `- ${entry.name}@${entry.version} | ${entry.license}${approvalMap.has(`${entry.name}@${entry.version}`) ? ' | approved' : ' | unresolved'}`)
      .join('\n')
  : '- 없음';

const approvedReviewSection = approvedReviewList.length
  ? approvedReviewList
      .map(({ entry, approval }) => {
        const resolved = approval.resolvedLicense ? ` | resolved: ${approval.resolvedLicense}` : '';
        const note = approval.note ? ` | note: ${approval.note}` : '';
        return `- ${entry.name}@${entry.version} | ${entry.license}${resolved}${note}`;
      })
      .join('\n')
  : '- 없음';

const unresolvedReviewSection = unresolvedReviewList.length
  ? unresolvedReviewList
      .map((entry) => `- ${entry.name}@${entry.version} | ${entry.license}`)
      .join('\n')
  : '- 없음';

const forbiddenSection = forbiddenList.length
  ? forbiddenList
      .map((entry) => `- ${entry.name}@${entry.version} | ${entry.license} | matched: ${entry.forbiddenHits.join(', ')}`)
      .join('\n')
  : '- 없음';

const packageSection = entries
  .map((entry) => `- ${entry.name}@${entry.version} | ${entry.license}${entry.repository ? ` | ${entry.repository}` : ''}`)
  .join('\n');

const now = new Date().toISOString();
const notice = [
  '# THIRD_PARTY_NOTICES',
  '',
  `- generatedAt: ${now}`,
  `- totalPackages: ${entries.length}`,
  '',
  '## License Summary',
  summaryLines,
  '',
  '## Review Required (Policy)',
  reviewSection,
  '',
  '## Review Approved',
  approvedReviewSection,
  '',
  '## Review Unresolved',
  unresolvedReviewSection,
  '',
  '## Forbidden Matches (Policy)',
  forbiddenSection,
  '',
  '## Package List',
  packageSection,
  ''
].join('\n');

writeFileSync(noticesPath, notice, 'utf8');

console.log(`[license:audit] notices generated: ${noticesPath}`);
console.log(`[license:audit] total packages: ${entries.length}`);
console.log(`[license:audit] review required: ${reviewList.length}`);
console.log(`[license:audit] review approved: ${approvedReviewList.length}`);
console.log(`[license:audit] review unresolved: ${unresolvedReviewList.length}`);
console.log(`[license:audit] forbidden matches: ${forbiddenList.length}`);

if (forbiddenList.length > 0) {
  console.error('[license:audit] forbidden license detected. Failing.');
  process.exit(1);
}

if (unresolvedReviewList.length > 0) {
  console.error('[license:audit] unresolved review-required licenses detected. Failing.');
  process.exit(1);
}