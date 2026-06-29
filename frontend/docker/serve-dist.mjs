import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { access, stat } from "node:fs/promises";
import path from "node:path";

const rootDir = path.resolve(process.cwd(), "dist");
const fallbackFile = path.join(rootDir, "index.html");
const port = Number(process.env.PORT ?? 3000);
const gatewayProxyBaseUrl = process.env.INTERNAL_CONTENT_GATEWAY_URL ?? "http://content-gateway:5100";
const bookingProxyBaseUrl = process.env.INTERNAL_BOOKING_URL ?? "https://backend.booking.guben.de";

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
};

const fileExists = async (filePath) => {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
};

const resolveRequestFile = async (requestPath) => {
  const normalizedPath = decodeURIComponent(requestPath.split("?")[0] || "/");
  const relativePath = normalizedPath.replace(/^\/+/, "");
  const candidatePath = path.resolve(rootDir, relativePath);

  if (!candidatePath.startsWith(rootDir)) {
    return null;
  }

  if (await fileExists(candidatePath)) {
    const candidateStat = await stat(candidatePath);
    if (candidateStat.isDirectory()) {
      const directoryIndex = path.join(candidatePath, "index.html");
      return (await fileExists(directoryIndex)) ? directoryIndex : fallbackFile;
    }

    return candidatePath;
  }

  if (path.extname(candidatePath)) {
    return null;
  }

  const nestedIndex = path.join(candidatePath, "index.html");
  if (await fileExists(nestedIndex)) {
    return nestedIndex;
  }

  const htmlFile = `${candidatePath}.html`;
  if (await fileExists(htmlFile)) {
    return htmlFile;
  }

  return fallbackFile;
};

const shouldProxyToGateway = (requestPath) => {
  const normalizedPath = decodeURIComponent((requestPath ?? "/").split("?")[0] || "/");
  return normalizedPath === "/api/content" || normalizedPath.startsWith("/api/content/");
};

const shouldProxyToBooking = (requestPath) => {
  const normalizedPath = decodeURIComponent((requestPath ?? "/").split("?")[0] || "/");
  return normalizedPath === "/api/booking" || normalizedPath.startsWith("/api/booking/");
};

const proxyToGateway = async (request, response) => {
  const targetUrl = new URL(request.url ?? "/", gatewayProxyBaseUrl).toString();
  const upstreamResponse = await fetch(targetUrl, {
    method: request.method,
    headers: {
      accept: request.headers.accept ?? "application/json",
      "accept-language": request.headers["accept-language"] ?? "",
      "x-forwarded-host": request.headers.host ?? "",
      "x-forwarded-proto": "https",
    },
  });

  const headers = Object.fromEntries(upstreamResponse.headers.entries());
  response.writeHead(upstreamResponse.status, headers);

  if (request.method === "HEAD") {
    response.end();
    return;
  }

  const bodyText = await upstreamResponse.text();
  response.end(bodyText);
};

const proxyToBooking = async (request, response) => {
  const requestPath = decodeURIComponent((request.url ?? "/").split("?")[0] || "/");
  const upstreamPath = requestPath.replace(/^\/api\/booking/, "") || "/";
  const targetUrl = new URL(upstreamPath, bookingProxyBaseUrl).toString();
  const upstreamResponse = await fetch(targetUrl, {
    method: request.method,
    headers: {
      accept: request.headers.accept ?? "text/html,application/xhtml+xml",
      "accept-language": request.headers["accept-language"] ?? "",
      "user-agent": request.headers["user-agent"] ?? "guben-cockpit-web",
      "x-forwarded-host": request.headers.host ?? "",
      "x-forwarded-proto": "https",
    },
  });

  const headers = Object.fromEntries(upstreamResponse.headers.entries());
  response.writeHead(upstreamResponse.status, headers);

  if (request.method === "HEAD") {
    response.end();
    return;
  }

  const bodyText = await upstreamResponse.text();
  response.end(bodyText);
};

const server = createServer(async (request, response) => {
  const method = request.method ?? "GET";
  if (method !== "GET" && method !== "HEAD") {
    response.writeHead(405, { "content-type": "text/plain; charset=utf-8" });
    response.end("Method Not Allowed");
    return;
  }

  try {
    if (shouldProxyToGateway(request.url)) {
      await proxyToGateway(request, response);
      return;
    }

    if (shouldProxyToBooking(request.url)) {
      await proxyToBooking(request, response);
      return;
    }

    const requestFile = await resolveRequestFile(request.url ?? "/");
    if (!requestFile) {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not Found");
      return;
    }

    const fileStat = await stat(requestFile);
    response.writeHead(200, {
      "content-length": String(fileStat.size),
      "content-type": contentTypes[path.extname(requestFile)] ?? "application/octet-stream",
    });

    if (method === "HEAD") {
      response.end();
      return;
    }

    createReadStream(requestFile).pipe(response);
  } catch (error) {
    console.error(error);
    response.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    response.end("Internal Server Error");
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Serving prerendered frontend from ${rootDir} on http://0.0.0.0:${port}`);
});
