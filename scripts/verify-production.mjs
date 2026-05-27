const baseUrl = process.argv[2] || process.env.PRODUCTION_URL || "https://winsproposal.com";
const paths = (process.env.VERIFY_PATHS || "/,/proposals").split(",").map((path) => path.trim()).filter(Boolean);

const failures = [];
const checkedUrls = [];
const scriptUrls = new Set();

function joinUrl(base, path) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

async function fetchText(url) {
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.text();
}

for (const path of paths) {
  const url = joinUrl(baseUrl, path);
  checkedUrls.push(url);

  try {
    const html = await fetchText(url);

    if (/apps\.abacus\.ai\/chatllm\/appllm-lib\.js/.test(html)) {
      failures.push(`${url} still includes the removed global Abacus AppLLM script.`);
    }

    for (const match of html.matchAll(/<script[^>]+src="([^"]+\.js[^"]*)"/g)) {
      const src = match[1];
      if (src.startsWith("/")) {
        scriptUrls.add(joinUrl(baseUrl, src));
      } else if (src.startsWith(baseUrl)) {
        scriptUrls.add(src);
      }
    }
  } catch (error) {
    failures.push(`Could not fetch ${url}. ${error.message}`);
  }
}

for (const scriptUrl of scriptUrls) {
  try {
    const script = await fetchText(scriptUrl);

    if (/Auto-generating diagram/.test(script)) {
      failures.push(`${scriptUrl} still contains the removed automatic diagram generation path.`);
    }

    if (/Status changed to/.test(script)) {
      failures.push(`${scriptUrl} still contains direct Draft/Final status toggle feedback.`);
    }

    if (/apps\.abacus\.ai\/chatllm\/appllm-lib\.js/.test(script)) {
      failures.push(`${scriptUrl} still references the removed global Abacus AppLLM script.`);
    }
  } catch (error) {
    failures.push(`Could not fetch script ${scriptUrl}. ${error.message}`);
  }
}

console.log("Checked live URLs:");
for (const url of checkedUrls) {
  console.log(` - ${url}`);
}
console.log(`Checked ${scriptUrls.size} Next.js script bundle(s).`);

if (failures.length > 0) {
  console.log("");
  console.log("FAIL: production verification failed.");
  for (const failure of failures) {
    console.log(` - ${failure}`);
  }
  process.exit(1);
}

console.log("");
console.log("PASS: production verification passed.");
