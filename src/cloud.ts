import type { GridContent } from "./data";

export type CloudSettings = {
  owner: string;
  repo: string;
  branch: string;
  path: string;
};

export type CloudStatus = {
  state: "idle" | "loading" | "ready" | "error" | "publishing";
  message: string;
};

export const defaultCloudSettings: CloudSettings = {
  owner: "canquancai-rgb",
  repo: "-",
  branch: "gh-pages",
  path: "content.json",
};

export async function loadCloudContent(): Promise<GridContent> {
  const url = new URL("content.json", window.location.href);
  url.searchParams.set("t", String(Date.now()));

  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) throw new Error(`读取线上数据失败：${response.status}`);

  return (await response.json()) as GridContent;
}

export async function publishCloudContent(
  settings: CloudSettings,
  token: string,
  content: GridContent,
): Promise<string> {
  const normalized = normalizeSettings(settings);
  if (!token.trim()) throw new Error("请先填写 GitHub 写入令牌。");

  const apiPath = encodeContentPath(normalized.path);
  const baseUrl = `https://api.github.com/repos/${encodeURIComponent(normalized.owner)}/${encodeURIComponent(
    normalized.repo,
  )}/contents/${apiPath}`;

  const existing = await githubRequest<{ sha?: string }>(
    `${baseUrl}?ref=${encodeURIComponent(normalized.branch)}`,
    token,
  );
  const json = `${JSON.stringify(content, null, 2)}\n`;

  const result = await githubRequest<{ content?: { html_url?: string } }>(baseUrl, token, {
    method: "PUT",
    body: JSON.stringify({
      message: `Update ordering content ${new Date().toISOString()}`,
      branch: normalized.branch,
      content: bytesToBase64(new TextEncoder().encode(json)),
      ...(existing?.sha ? { sha: existing.sha } : {}),
    }),
  });

  await triggerPagesBuild(normalized, token);

  return result.content?.html_url ?? `https://github.com/${normalized.owner}/${normalized.repo}`;
}

function normalizeSettings(settings: CloudSettings): CloudSettings {
  return {
    owner: settings.owner.trim() || defaultCloudSettings.owner,
    repo: settings.repo.trim() || defaultCloudSettings.repo,
    branch: settings.branch.trim() || defaultCloudSettings.branch,
    path: settings.path.trim().replace(/^\/+/, "") || defaultCloudSettings.path,
  };
}

async function githubRequest<T>(url: string, token: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token.trim()}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...init.headers,
    },
  });

  if (response.status === 404 && !init.method) return {} as T;

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(parseGithubError(errorText, response.status));
  }

  return (await response.json()) as T;
}

async function triggerPagesBuild(settings: CloudSettings, token: string) {
  const url = `https://api.github.com/repos/${encodeURIComponent(settings.owner)}/${encodeURIComponent(
    settings.repo,
  )}/pages/builds`;

  try {
    await githubRequest<{ status?: string }>(url, token, { method: "POST" });
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `内容已写入，但触发 GitHub Pages 构建失败：${error.message}`
        : "内容已写入，但触发 GitHub Pages 构建失败。",
    );
  }
}

function parseGithubError(errorText: string, status: number) {
  try {
    const parsed = JSON.parse(errorText) as { message?: string };
    return parsed.message ? `GitHub 返回错误：${parsed.message}` : `GitHub 返回错误：${status}`;
  } catch {
    return `GitHub 返回错误：${status}`;
  }
}

function encodeContentPath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}
