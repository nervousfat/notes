import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const cwd = path.dirname(fileURLToPath(import.meta.url));
const git = args => execFileSync('git', args, { cwd, encoding: 'utf8', windowsHide: true }).trim();
const log = git(['log', '--reverse', '--format=%H%x09%aI%x09%cI%x09%ae%x09%ce%x09%s']);
let lastAuthor = -Infinity;
let lastCommitter = -Infinity;
const records = log.split('\n').filter(Boolean).map(line => {
  const [commit, authorDate, commitDate, authorEmail, committerEmail, message] = line.split('\t');
  const stats = git(['diff-tree', '--root', '--no-commit-id', '--numstat', '-r', commit]);
  const files = stats.split('\n').filter(Boolean).map(stat => {
    const [added, removed, file] = stat.split('\t');
    return { file, added: added === '-' ? 0 : Number(added), removed: removed === '-' ? 0 : Number(removed) };
  });
  const codeLines = files.filter(item => /\.(js|mjs|css|html)$/.test(item.file)).reduce((sum, item) => sum + item.added + item.removed, 0);
  const authorTime = Date.parse(authorDate);
  const commitTime = Date.parse(commitDate);
  const increasing = authorTime > lastAuthor && commitTime > lastCommitter;
  lastAuthor = authorTime; lastCommitter = commitTime;
  return { commit, authorDate, commitDate, authorEmail, committerEmail, message, codeLines, increasing };
});
const summary = {
  repository: path.basename(cwd),
  commits: records.length,
  firstDate: records[0]?.authorDate,
  lastDate: records.at(-1)?.authorDate,
  authorEmails: [...new Set(records.map(record => record.authorEmail))],
  committerEmails: [...new Set(records.map(record => record.committerEmail))],
  datesStrictlyIncreasing: records.every(record => record.increasing),
  minimumCodeLines: Math.min(...records.map(record => record.codeLines)),
  maximumCodeLines: Math.max(...records.map(record => record.codeLines)),
  commitsWithoutCode: records.filter(record => record.codeLines === 0).length
};
console.log(JSON.stringify(process.argv.includes('--details') ? { summary, records } : summary, null, 2));
