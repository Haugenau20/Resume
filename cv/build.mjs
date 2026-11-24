// npm run cv                                   → the public CV (a draft preview until content.yaml says final)
// npm run cv -- "<Company>/<Role>"             → Resume.pdf + CoverLetter.pdf in that application folder
// npm run cv:new -- "<Company>" "<Role>"       → a new application folder, seeded from the latest one
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig, newApplication, buildApplication, buildPublic } from './applications.mjs';
import { loadContent } from './facts.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = loadConfig(path.join(repo, 'cv/local.json'), repo);
const args = process.argv.slice(2);

try {
  if (args[0] === '--new') {
    if (args.length !== 3) throw new Error('usage: npm run cv:new -- "<Company>" "<Role>"');
    const dir = newApplication(config, args[1], args[2]);
    console.log(`Created ${dir}\nEdit summary.md and cover-letter.md there, then: npm run cv -- "${args[1]}/${args[2]}"`);
  } else if (args.length === 1) {
    const { resume, letter } = await buildApplication(config, args[0]);
    console.log(`Wrote ${resume}\nWrote ${letter}`);
  } else if (args.length === 0) {
    const out = await buildPublic(repo);
    if (loadContent(repo).status !== 'final')
      console.log('content.yaml says status: draft, so files/Resume.pdf was left alone.');
    console.log(`Wrote ${out}`);
  } else {
    throw new Error('usage: npm run cv [-- "<Company>/<Role>"]  |  npm run cv:new -- "<Company>" "<Role>"');
  }
} catch (e) {
  console.error(`error: ${e.message.split('\n')[0]}`);
  process.exit(1);
}
