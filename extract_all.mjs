import fs from 'fs';

const content = fs.readFileSync('vercel_bundle.js', 'utf8');

const startIdx = content.indexOf('var br={emergency_priority:');
if (startIdx !== -1) {
  // Extract 15,000 characters from startIdx to catch all 7 scenarios & player logic
  const snippet = content.substring(startIdx, startIdx + 25000);
  fs.writeFileSync('extracted_scenarios.js', snippet);
  console.log('Extracted scenarios saved to extracted_scenarios.js (length:', snippet.length, ')');
} else {
  console.log('Could not find startIdx');
}
