import { $ } from "bun";
import { writeFileSync, readFileSync } from "node:fs";

const TEMPLATE_NAME = "astroflare";
const CF_TOKEN_URL = "https://dash.cloudflare.com/profile/api-tokens";

async function checkDependencies() {
  try {
    await $`gh --version`.quiet();
    const authStatus = await $`gh auth status`.quiet();
  } catch (e) {
    throw new Error("GitHub CLI (gh) is not installed or not authenticated. Please run 'brew install gh' and 'gh auth login'.");
  }
}

async function main() {
  console.log("\n🚀 Starting Astroflare Project Setup...\n");

  await checkDependencies();

  // 1. Get Repo Info for the Failure Link
  const repoPath = (await $`gh repo view --json nameWithOwner -q .nameWithOwner`.text()).trim();
  const actionsUrl = `https://github.com/${repoPath}/actions/runs/2`;

  // 2. Rename Project
  const newProjectName = prompt("Enter your new project name (kebab-case):");
  if (!newProjectName) throw new Error("Project name is required.");

  console.log(`\x1b[34m[1/5]\x1b[0m Renaming ${TEMPLATE_NAME} to ${newProjectName}...`);
  
  const filesToUpdate = [
    "./wrangler.jsonc", 
    "./.github/workflows/deploy.yml", 
    "./package.json"
  ];

  for (const path of filesToUpdate) {
    try {
      const content = readFileSync(path, "utf-8");
      writeFileSync(path, content.replaceAll(TEMPLATE_NAME, newProjectName));
    } catch (e) {
      console.warn(`Could not update ${path}, skipping...`);
    }
  }

  // 3. Cloudflare Credentials
  console.log(`\x1b[34m[2/5]\x1b[0m Please create a Cloudflare API Token.`);
  console.log(`      Template: "Edit Cloudflare Workers"`);
  console.log(`      Suggested Name: "Deploy ${newProjectName}"`);
  
  if (prompt("Press Enter to open the Cloudflare Dashboard (or 's' to skip):") !== 's') {
    await $`open ${CF_TOKEN_URL}`.quiet();
  }

  const cfToken = prompt("Paste your Cloudflare API Token:");
  const cfAccountId = prompt("Paste your Cloudflare Account ID:");

  if (!cfToken || !cfAccountId) throw new Error("Credentials are required.");

  // 4. Set Secrets & Push (Amend Initial Commit)
  console.log(`\x1b[34m[3/5]\x1b[0m Setting GitHub Secrets...`);
  await $`gh secret set CLOUDFLARE_API_TOKEN --body ${cfToken}`;
  await $`gh secret set CLOUDFLARE_ACCOUNT_ID --body ${cfAccountId}`;

  console.log(`\x1b[34m[4/5]\x1b[0m Amending initial commit and force pushing...`);
  await $`git add .`;
  await $`git commit --amend --no-edit`;
  // Use force-with-lease for safer force pushing
  await $`git push --force-with-lease`;

  // 5. Polling with 5-minute Timeout
  const deployUrl = `https://${newProjectName}.tmercer.workers.dev`;
  console.log(`\x1b[34m[5/5]\x1b[0m Waiting for deployment at ${deployUrl}...`);

  const startTime = Date.now();
  const timeout = 5 * 60 * 1000; 
  let isLive = false;

  while (Date.now() - startTime < timeout) {
    process.stdout.write(".");
    try {
      // Using a no-cache fetch to ensure we see the live site immediately
      const res = await fetch(deployUrl, { cache: "no-store" });
      if (res.status === 200) {
        isLive = true;
        break;
      }
    } catch (e) {
      // Worker not live or DNS not propagated
    }
    await new Promise(r => setTimeout(r, 5000));
  }

  console.log("\n");

  if (isLive) {
    console.log(`\x1b[32m[Success]\x1b[0m Setup Complete!`);
    console.log(`🎉 Your project is live at: \x1b[4m${deployUrl}\x1b[0m\n`);
  } else {
    console.log(`\x1b[31m[Timeout]\x1b[0m Deployment is taking longer than expected.`);
    console.log(`Please check the build logs for \x1b[1mRun #2\x1b[0m here:`);
    console.log(`\x1b[34m${actionsUrl}\x1b[0m\n`);
  }
}

main().catch((err) => {
  console.error(`\n\x1b[31m[Error]\x1b[0m ${err.message}`);
  process.exit(1);
});
