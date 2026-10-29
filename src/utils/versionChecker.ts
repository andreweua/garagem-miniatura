export interface RemoteVersionInfo {
  version: string;
  releaseDate?: string;
  releaseNotes?: string;
  downloadUrl?: string;
}

export function parseSemVer(v: string): number[] {
  const cleaned = v.replace(/^v/i, '').trim();
  const parts = cleaned.split('.').map((n) => parseInt(n, 10) || 0);
  while (parts.length < 3) parts.push(0);
  return parts;
}

export function isNewerVersion(current: string, remote: string): boolean {
  if (!remote || !current) return false;
  const [cMajor, cMinor, cPatch] = parseSemVer(current);
  const [rMajor, rMinor, rPatch] = parseSemVer(remote);

  if (rMajor > cMajor) return true;
  if (rMajor < cMajor) return false;
  if (rMinor > cMinor) return true;
  if (rMinor < cMinor) return false;
  return rPatch > cPatch;
}

export async function fetchLatestVersion(): Promise<RemoteVersionInfo | null> {
  const sources = [
    `https://raw.githubusercontent.com/andreweua/garagem-miniatura/main/public/version.json?t=${Date.now()}`,
    `https://andreweua.github.io/garagem-miniatura/version.json?t=${Date.now()}`,
    `./version.json?t=${Date.now()}`
  ];

  for (const url of sources) {
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (response.ok) {
        const data = (await response.json()) as RemoteVersionInfo;
        if (data && data.version) {
          return data;
        }
      }
    } catch {
      // Tenta a próxima fonte
    }
  }

  return null;
}
