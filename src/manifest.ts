import packageJson from "../package.json";

const manifest: chrome.runtime.Manifest = {
  manifest_version: 3,
  name: packageJson.name,
  author: packageJson.author,
  version: packageJson.version,
  description: packageJson.description,
  icons: {
    "16": "icons/icon-16.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png",
  },
  permissions: ["tabs", "unlimitedStorage", "storage"],
  background: {
    service_worker: "scripts/background.js",
  },
  content_scripts: [
    {
      matches: ["https://leetcode.com/*", "https://github.com/*"],
      js: ["scripts/leetcode.js", "scripts/authorize.js"],
      run_at: "document_idle",
    },
  ],
};

export default manifest;
