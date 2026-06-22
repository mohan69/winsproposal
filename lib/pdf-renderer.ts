type PdfRenderOptions = {
  stage: string;
  html: string;
  baseUrl?: string;
  footerTemplate?: string;
  headerTemplate?: string;
  timeoutAttempts?: number;
  pollIntervalMs?: number;
  diagnostics?: PdfRenderDiagnostics;
  forceAbacusFailure?: boolean;
  forceChromiumFailure?: boolean;
  disablePdfLibFallback?: boolean;
};

export type PdfRenderResult = {
  pdfBuffer: Buffer;
  requestId: string;
  stage: string;
  renderer: "abacus-html-to-pdf" | "local-chromium" | "pdf-lib";
};

export type PdfRenderDiagnostics = {
  rendererAttempted: string[];
  abacusStatus?: string;
  chromiumAttempted: boolean;
  chromiumExecutablePathResolved: boolean;
  pdfLibAttempted: boolean;
  finalSuccess: boolean;
  finalRenderer?: string;
  finalStage?: string;
  safeErrorMessage?: string;
};

export function createPdfRenderDiagnostics(): PdfRenderDiagnostics {
  return {
    rendererAttempted: [],
    chromiumAttempted: false,
    chromiumExecutablePathResolved: false,
    pdfLibAttempted: false,
    finalSuccess: false,
  };
}

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

function markSuccess(options: PdfRenderOptions, renderer: string, stage: string) {
  if (!options.diagnostics) return;
  options.diagnostics.finalSuccess = true;
  options.diagnostics.finalRenderer = renderer;
  options.diagnostics.finalStage = stage;
  options.diagnostics.safeErrorMessage = undefined;
}

function markFailure(options: PdfRenderOptions, message: string) {
  if (!options.diagnostics) return;
  options.diagnostics.safeErrorMessage = message;
}

async function renderWithAbacus(options: PdfRenderOptions): Promise<PdfRenderResult> {
  options.diagnostics?.rendererAttempted.push("abacus-html-to-pdf");
  if (options.forceAbacusFailure) {
    options.diagnostics && (options.diagnostics.abacusStatus = "forced-failure");
    throw new PdfRenderError(options.stage, "Forced Abacus renderer failure.");
  }
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
    options.diagnostics && (options.diagnostics.abacusStatus = String(createResponse.status));
    console.error(`PDF create failed; stage=${stage}; status=${createResponse.status}; reason=${errorText.slice(0, 500)}`);
    throw new PdfRenderError(stage, `Create request failed with status ${createResponse.status}.`, createResponse.status);
  }
  options.diagnostics && (options.diagnostics.abacusStatus = "created");

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
      markSuccess(options, "abacus-html-to-pdf", stage);
      console.info(`PDF renderer succeeded; stage=${stage}; requestId=${requestId}; bytes=${pdfBuffer.length}`);
      return { pdfBuffer, requestId, stage, renderer: "abacus-html-to-pdf" };
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
  const isExecutableFile = (candidate: string) => {
    try {
      return Boolean(candidate) && fs.existsSync(candidate) && fs.statSync(candidate).isFile();
    } catch {
      return false;
    }
  };
  const explicit = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_EXECUTABLE_PATH;
  if (explicit && isExecutableFile(explicit)) return explicit;

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
  if (process.platform === "win32") {
    for (const candidate of candidates) {
      if (isExecutableFile(candidate)) return candidate;
    }
  }

  const serverlessPath = await chromium.executablePath().catch(() => "");
  if (serverlessPath && isExecutableFile(serverlessPath)) return serverlessPath;

  for (const candidate of candidates) {
    if (isExecutableFile(candidate)) return candidate;
  }

  return serverlessPath || undefined;
}

async function renderWithLocalChromium(options: PdfRenderOptions): Promise<PdfRenderResult> {
  const stage = `${options.stage}-local-chromium`;
  let browser: any = null;
  try {
    options.diagnostics?.rendererAttempted.push("local-chromium");
    options.diagnostics && (options.diagnostics.chromiumAttempted = true);
    if (options.forceChromiumFailure) throw new PdfRenderError(stage, "Forced Chromium renderer failure.");
    const puppeteerModule = await import("puppeteer-core");
    const chromiumModule = await import("@sparticuz/chromium");
    const puppeteer = puppeteerModule.default ?? puppeteerModule;
    const chromium = (chromiumModule.default ?? chromiumModule) as any;
    const executablePath = await resolveChromiumExecutable(chromium);
    options.diagnostics && (options.diagnostics.chromiumExecutablePathResolved = Boolean(executablePath));
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
      defaultViewport: chromium.defaultViewport ?? { width: 1240, height: 1754 },
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
    markSuccess(options, "local-chromium", stage);
    console.info(`PDF renderer succeeded: local Chromium; stage=${stage}; bytes=${pdfBuffer.length}`);
    return { pdfBuffer, requestId: "local-chromium", stage, renderer: "local-chromium" };
  } catch (error: any) {
    if (error instanceof PdfRenderError) throw error;
    console.error(`Local Chromium PDF render failed; stage=${stage}; reason=${String(error?.message ?? error).slice(0, 500)}`);
    throw new PdfRenderError(stage, "Local Chromium render failed.");
  } finally {
    if (browser) await browser.close().catch(() => undefined);
  }
}

function htmlToPlainText(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<\/(h1|h2|h3|p|tr|section|div)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function sanitizePdfText(value: string) {
  return value
    .replace(/[→↔↦⇒]/g, "->")
    .replace(/[–—]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[₹]/g, "INR ")
    .replace(/[×]/g, "x")
    .replace(/[°]/g, " deg ")
    .replace(/[•]/g, "-")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "");
}

function extractHtmlTitle(html: string) {
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  const title = sanitizePdfText(htmlToPlainText(h1 || "")).trim();
  return title || "WinsProposal Proposal Export";
}

function wrapPdfText(text: string, maxChars: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > maxChars) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = (current + " " + word).trim();
    }
  }
  if (current) lines.push(current);
  return lines;
}

async function renderWithPdfLib(options: PdfRenderOptions): Promise<PdfRenderResult> {
  const stage = `${options.stage}-pdf-lib`;
  options.diagnostics?.rendererAttempted.push("pdf-lib");
  options.diagnostics && (options.diagnostics.pdfLibAttempted = true);

  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const margin = 48;
  const width = 595.28;
  const height = 841.89;
  const maxLines = 42;
  const text = sanitizePdfText(htmlToPlainText(options.html)).slice(0, 16000) || "WinsProposal PDF export fallback.";
  const paragraphs = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  let page = doc.addPage([width, height]);
  let y = height - margin;
  let lineCount = 0;

  const addPage = () => {
    page.drawText("WinsProposal | Proposal-stage engineering estimate", {
      x: margin,
      y: 24,
      size: 8,
      font,
      color: rgb(0.38, 0.45, 0.55),
    });
    page = doc.addPage([width, height]);
    y = height - margin;
    lineCount = 0;
  };

  page.drawText(extractHtmlTitle(options.html).slice(0, 90), {
    x: margin,
    y,
    size: 16,
    font: bold,
    color: rgb(0.08, 0.2, 0.25),
  });
  y -= 24;
  page.drawText("Detailed drawings and technical appendix are available in DOCX export where applicable.", {
    x: margin,
    y,
    size: 9,
    font,
    color: rgb(0.57, 0.25, 0.05),
  });
  y -= 22;

  for (const paragraph of paragraphs) {
    const lines = wrapPdfText(paragraph, 92);
    for (const line of lines) {
      if (lineCount >= maxLines || y < 56) addPage();
      const isHeading = /^(Hydrogen|Executive|Scope|Process|Compliance|Commercial|Proposal|Ultra-minimal|Simplified)/i.test(line);
      page.drawText(sanitizePdfText(line).slice(0, 140), {
        x: margin,
        y,
        size: isHeading ? 10 : 8.5,
        font: isHeading ? bold : font,
        color: rgb(0.12, 0.16, 0.22),
      });
      y -= isHeading ? 15 : 11;
      lineCount++;
    }
    y -= 4;
  }
  page.drawText("WinsProposal | Proposal-stage engineering estimate", {
    x: margin,
    y: 24,
    size: 8,
    font,
    color: rgb(0.38, 0.45, 0.55),
  });

  const pdfBytes = await doc.save();
  const pdfBuffer = Buffer.from(pdfBytes);
  assertPdfBuffer(stage, pdfBuffer);
  markSuccess(options, "pdf-lib", stage);
  console.info(`PDF renderer succeeded: pdf-lib; stage=${stage}; bytes=${pdfBuffer.length}`);
  return { pdfBuffer, requestId: "pdf-lib", stage, renderer: "pdf-lib" };
}

export async function renderHtmlToPdf(options: PdfRenderOptions): Promise<PdfRenderResult> {
  try {
    return await renderWithAbacus(options);
  } catch (abacusError: any) {
    const safeReason = abacusError instanceof PdfRenderError ? abacusError.safeReason : abacusError?.message ?? "Unknown Abacus renderer error.";
    console.warn(`Abacus PDF renderer unavailable; stage=${options.stage}; reason=${safeReason}; trying local Chromium fallback.`);
    markFailure(options, safeReason);
    try {
      return await renderWithLocalChromium(options);
    } catch (chromiumError: any) {
      const chromiumReason = chromiumError instanceof PdfRenderError ? chromiumError.safeReason : chromiumError?.message ?? "Unknown Chromium renderer error.";
      console.warn(`Chromium PDF renderer unavailable; stage=${options.stage}; reason=${chromiumReason}; trying pdf-lib fallback.`);
      markFailure(options, chromiumReason);
      if (options.disablePdfLibFallback) throw chromiumError;
      return renderWithPdfLib(options);
    }
  }
}
