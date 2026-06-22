type PdfRenderOptions = {
  stage: string;
  html: string;
  baseUrl?: string;
  footerTemplate?: string;
  headerTemplate?: string;
  timeoutAttempts?: number;
  pollIntervalMs?: number;
};

export type PdfRenderResult = {
  pdfBuffer: Buffer;
  requestId: string;
  stage: string;
};

export class PdfRenderError extends Error {
  stage: string;
  safeReason: string;
  status?: number;

  constructor(stage: string, safeReason: string, status?: number) {
    super(`${stage}: ${safeReason}`);
    this.name = "PdfRenderError";
    this.stage = stage;
    this.safeReason = safeReason;
    this.status = status;
  }
}

function getPdfDeploymentToken() {
  const token = process.env.ABACUSAI_API_KEY;
  return token;
}

function assertPdfBuffer(stage: string, buffer: Buffer) {
  if (!buffer.length) throw new PdfRenderError(stage, "Renderer returned an empty PDF.");
  if (buffer.subarray(0, 4).toString("utf8") !== "%PDF") {
    throw new PdfRenderError(stage, "Renderer returned non-PDF data.");
  }
}

async function renderWithAbacus(options: PdfRenderOptions): Promise<PdfRenderResult> {
  const token = getPdfDeploymentToken();
  if (!token) throw new PdfRenderError(options.stage, "Abacus PDF renderer API key is not configured.");
  const stage = options.stage;
  const timeoutAttempts = options.timeoutAttempts ?? 120;
  const pollIntervalMs = options.pollIntervalMs ?? 1500;

  console.info(`PDF renderer selected: Abacus HTML-to-PDF; stage=${stage}; htmlBytes=${Buffer.byteLength(options.html, "utf8")}`);

  const createResponse = await fetch("https://apps.abacus.ai/api/createConvertHtmlToPdfRequest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      deployment_token: token,
      html_content: options.html,
      pdf_options: {
        format: "A4",
        print_background: true,
        margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
        display_header_footer: Boolean(options.footerTemplate || options.headerTemplate),
        header_template: options.headerTemplate ?? "<div></div>",
        footer_template: options.footerTemplate ?? "<div></div>",
      },
      base_url: options.baseUrl ?? process.env.NEXTAUTH_URL ?? "",
    }),
  });

  if (!createResponse.ok) {
    const errorText = await createResponse.text().catch(() => "");
    console.error(`PDF create failed; stage=${stage}; status=${createResponse.status}; reason=${errorText.slice(0, 500)}`);
    throw new PdfRenderError(stage, `Create request failed with status ${createResponse.status}.`, createResponse.status);
  }

  const createResult = await createResponse.json().catch(() => null);
  const requestId = createResult?.request_id;
  if (!requestId) throw new PdfRenderError(stage, "Renderer did not return a request id.");

  console.info(`PDF renderer request created; stage=${stage}; requestId=${requestId}`);

  for (let attempts = 0; attempts < timeoutAttempts; attempts++) {
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));

    const statusResponse = await fetch("https://apps.abacus.ai/api/getConvertHtmlToPdfStatus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ request_id: requestId, deployment_token: token }),
    });

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text().catch(() => "");
      console.error(`PDF status failed; stage=${stage}; requestId=${requestId}; status=${statusResponse.status}; reason=${errorText.slice(0, 500)}`);
      throw new PdfRenderError(stage, `Status request failed with status ${statusResponse.status}.`, statusResponse.status);
    }

    const statusResult = await statusResponse.json().catch(() => null);
    const status = statusResult?.status || "FAILED";

    if (status === "SUCCESS") {
      const base64 = statusResult?.result?.result;
      if (!base64) throw new PdfRenderError(stage, "Renderer succeeded but returned no PDF data.");
      const pdfBuffer = Buffer.from(base64, "base64");
      assertPdfBuffer(stage, pdfBuffer);
      console.info(`PDF renderer succeeded; stage=${stage}; requestId=${requestId}; bytes=${pdfBuffer.length}`);
      return { pdfBuffer, requestId, stage };
    }

    if (status === "FAILED") {
      console.error(`PDF conversion failed; stage=${stage}; requestId=${requestId}; status=${JSON.stringify(statusResult).slice(0, 800)}`);
      throw new PdfRenderError(stage, "Renderer conversion failed.");
    }
  }

  throw new PdfRenderError(stage, "Renderer timed out.");
}

async function resolveChromiumExecutable(chromium: any) {
  const fs = await import("node:fs");
  const explicit = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_EXECUTABLE_PATH;
  if (explicit && fs.existsSync(explicit)) return explicit;

  const candidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  const serverlessPath = await chromium.executablePath().catch(() => "");
  return serverlessPath || undefined;
}

async function renderWithLocalChromium(options: PdfRenderOptions): Promise<PdfRenderResult> {
  const stage = `${options.stage}-local-chromium`;
  let browser: any = null;
  try {
    const puppeteerModule = await import("puppeteer-core");
    const chromiumModule = await import("@sparticuz/chromium");
    const puppeteer = puppeteerModule.default ?? puppeteerModule;
    const chromium = (chromiumModule.default ?? chromiumModule) as any;
    const executablePath = await resolveChromiumExecutable(chromium);
    if (!executablePath) throw new PdfRenderError(stage, "No Chromium executable found.");

    const launchArgs = [
      ...(chromium.args ?? []),
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ];

    console.info(`PDF renderer selected: local Chromium; stage=${stage}; executable=${executablePath ? "resolved" : "missing"}; htmlBytes=${Buffer.byteLength(options.html, "utf8")}`);
    browser = await puppeteer.launch({
      args: launchArgs,
      executablePath,
      headless: chromium.headless ?? true,
      defaultViewport: { width: 1240, height: 1754 },
    });

    const page = await browser.newPage();
    await page.setContent(options.html, { waitUntil: "networkidle0", timeout: 45000 });
    await page.emulateMediaType("print");
    const pdfBytes = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: Boolean(options.footerTemplate || options.headerTemplate),
      headerTemplate: options.headerTemplate ?? "<div></div>",
      footerTemplate: options.footerTemplate ?? "<div></div>",
      margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
      preferCSSPageSize: true,
    });
    const pdfBuffer = Buffer.from(pdfBytes);
    assertPdfBuffer(stage, pdfBuffer);
    console.info(`PDF renderer succeeded: local Chromium; stage=${stage}; bytes=${pdfBuffer.length}`);
    return { pdfBuffer, requestId: "local-chromium", stage };
  } catch (error: any) {
    if (error instanceof PdfRenderError) throw error;
    console.error(`Local Chromium PDF render failed; stage=${stage}; reason=${String(error?.message ?? error).slice(0, 500)}`);
    throw new PdfRenderError(stage, "Local Chromium render failed.");
  } finally {
    if (browser) await browser.close().catch(() => undefined);
  }
}

export async function renderHtmlToPdf(options: PdfRenderOptions): Promise<PdfRenderResult> {
  try {
    return await renderWithAbacus(options);
  } catch (abacusError: any) {
    const safeReason = abacusError instanceof PdfRenderError ? abacusError.safeReason : abacusError?.message ?? "Unknown Abacus renderer error.";
    console.warn(`Abacus PDF renderer unavailable; stage=${options.stage}; reason=${safeReason}; trying local Chromium fallback.`);
    return renderWithLocalChromium(options);
  }
}
