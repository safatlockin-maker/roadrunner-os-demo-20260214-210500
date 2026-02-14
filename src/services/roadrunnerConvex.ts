export function getConvexConfig() {
  return {
    deploymentUrl: (import.meta.env.VITE_CONVEX_URL as string | undefined)?.trim() ?? '',
    siteUrl: (import.meta.env.VITE_CONVEX_SITE_URL as string | undefined)?.trim() ?? '',
  };
}

export function isConvexConfigured(): boolean {
  const config = getConvexConfig();
  return Boolean(config.deploymentUrl || config.siteUrl);
}
