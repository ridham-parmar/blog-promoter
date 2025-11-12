import { Octokit } from '@octokit/rest';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

export async function getUncachableGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

export async function listBlogPRs(owner: string, repo: string, branchPrefix: string, stagingBranch: string) {
  const octokit = await getUncachableGitHubClient();
  
  const { data: pullRequests } = await octokit.rest.pulls.list({
    owner,
    repo,
    state: 'open',
    base: stagingBranch,
  });

  return pullRequests.filter(pr => pr.head.ref.startsWith(branchPrefix));
}

export async function mergePR(owner: string, repo: string, prNumber: number, commitTitle?: string) {
  const octokit = await getUncachableGitHubClient();
  
  const { data } = await octokit.rest.pulls.merge({
    owner,
    repo,
    pull_number: prNumber,
    commit_title: commitTitle,
    merge_method: 'merge',
  });

  return data;
}

export async function createPR(
  owner: string,
  repo: string,
  title: string,
  head: string,
  base: string,
  body?: string
) {
  const octokit = await getUncachableGitHubClient();
  
  const { data } = await octokit.rest.pulls.create({
    owner,
    repo,
    title,
    head,
    base,
    body: body || '',
  });

  return data;
}

export async function checkPRMergeable(owner: string, repo: string, prNumber: number): Promise<boolean> {
  const octokit = await getUncachableGitHubClient();
  
  const { data: pr } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
  });

  return pr.mergeable === true && pr.mergeable_state === 'clean';
}

export async function checkStagingToMainPRExists(owner: string, repo: string, stagingBranch: string, mainBranch: string): Promise<number | null> {
  const octokit = await getUncachableGitHubClient();
  
  const { data: pullRequests } = await octokit.rest.pulls.list({
    owner,
    repo,
    state: 'open',
    head: `${owner}:${stagingBranch}`,
    base: mainBranch,
  });

  return pullRequests.length > 0 ? pullRequests[0].number : null;
}
