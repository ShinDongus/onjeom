import type { ConfigContext, ExpoConfig } from "expo/config";
export default function configForHost({ config }: ConfigContext): ExpoConfig {
  const base = process.env.ONJEOM_WEB_BASE_PATH || "";
  if (base && !/^\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/.test(base))
    throw Error(
      "ONJEOM_WEB_BASE_PATH must be an absolute path without a trailing slash.",
    );
  return {
    ...config,
    name: config.name || "온점.",
    slug: config.slug || "onjeom",
    experiments: { ...config.experiments, baseUrl: base },
  };
}
