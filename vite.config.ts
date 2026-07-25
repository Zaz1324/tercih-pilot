import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function yokAtlasProxy() {
  return {
    name: "yok-atlas-local-proxy",
    configureServer(server) {
      server.middlewares.use(
        "/local-yok-atlas/search",
        async (request, response, next) => {
          if (request.method !== "POST") {
            next();
            return;
          }

          try {
            const body = await readRequestBody(request);
            const atlasResponse = await fetch(
              "https://yokatlas.yok.gov.tr/api/tercih-kilavuz/search",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "User-Agent": "Mozilla/5.0",
                },
                body,
              },
            );

            response.statusCode = atlasResponse.status;
            response.setHeader("Content-Type", "application/json");
            response.end(await atlasResponse.text());
          } catch (error) {
            response.statusCode = 502;
            response.setHeader("Content-Type", "application/json");
            response.end(
              JSON.stringify({
                message:
                  error instanceof Error
                    ? error.message
                    : "YÖK Atlas proxy hatası",
              }),
            );
          }
        },
      );

      server.middlewares.use(
        "/local-yok-atlas/options",
        async (request, response, next) => {
          if (request.method !== "GET") {
            next();
            return;
          }

          const optionPath = request.url?.split("/").filter(Boolean).at(-1);
          const allowedPaths = new Set([
            "universite-programlar",
            "universite-iller",
            "universiteler",
          ]);
          if (!optionPath || !allowedPaths.has(optionPath)) {
            response.statusCode = 404;
            response.end("Bilinmeyen YÖK Atlas seçenek uç noktası");
            return;
          }

          try {
            const atlasResponse = await fetch(
              `https://yokatlas.yok.gov.tr/api/tercih-kilavuz/${optionPath}`,
              {
                headers: {
                  "User-Agent": "Mozilla/5.0",
                },
              },
            );

            response.statusCode = atlasResponse.status;
            response.setHeader("Content-Type", "application/json");
            response.end(await atlasResponse.text());
          } catch (error) {
            response.statusCode = 502;
            response.setHeader("Content-Type", "application/json");
            response.end(
              JSON.stringify({
                message:
                  error instanceof Error
                    ? error.message
                    : "YÖK Atlas seçenek proxy hatası",
              }),
            );
          }
        },
      );

      server.middlewares.use(
        "/local-yok-akademik",
        async (request, response, next) => {
          if (request.method !== "GET") {
            next();
            return;
          }

          const url = new URL(request.url ?? "", "http://localhost");
          const academicLink = url.searchParams.get("akademikLink");
          if (!academicLink) {
            response.statusCode = 400;
            response.end("akademikLink parametresi eksik");
            return;
          }

          try {
            const html = await fetchAcademicHtml(
              `https://yokatlas.yok.gov.tr/api/yokakademik-redirect?akademikLink=${encodeURIComponent(
                academicLink,
              )}`,
            );

            response.statusCode = 200;
            response.setHeader("Content-Type", "text/html; charset=utf-8");
            response.end(html);
          } catch (error) {
            response.statusCode = 502;
            response.setHeader("Content-Type", "text/plain; charset=utf-8");
            response.end(
              error instanceof Error
                ? error.message
                : "YÖK Akademik proxy hatası",
            );
          }
        },
      );

      server.middlewares.use(
        "/local-yok-akademik-page",
        async (request, response, next) => {
          if (request.method !== "GET") {
            next();
            return;
          }

          const requestUrl = new URL(request.url ?? "", "http://localhost");
          const target = requestUrl.searchParams.get("url");
          const seed = requestUrl.searchParams.get("seedUrl");
          if (!target) {
            response.statusCode = 400;
            response.end("url parametresi eksik");
            return;
          }

          const targetUrl = new URL(target, "https://akademik.yok.gov.tr");
          if (
            targetUrl.hostname !== "akademik.yok.gov.tr" ||
            !targetUrl.pathname.startsWith("/AkademikArama/")
          ) {
            response.statusCode = 400;
            response.end("Yalnızca YÖK Akademik sayfaları alınabilir");
            return;
          }

          const seedUrl = seed
            ? new URL(seed, "https://akademik.yok.gov.tr")
            : null;
          if (
            seedUrl &&
            (seedUrl.hostname !== "akademik.yok.gov.tr" ||
              !seedUrl.pathname.startsWith("/AkademikArama/"))
          ) {
            response.statusCode = 400;
            response.end("Yalnızca YÖK Akademik seed sayfaları alınabilir");
            return;
          }

          try {
            const cookies = new Map<string, string>();
            if (seedUrl) {
              await fetchTextWithCookies(seedUrl.toString(), 8, cookies);
            }
            const html = await fetchTextWithCookies(
              targetUrl.toString(),
              8,
              cookies,
            );

            response.statusCode = 200;
            response.setHeader("Content-Type", "text/html; charset=utf-8");
            response.end(html);
          } catch (error) {
            response.statusCode = 502;
            response.setHeader("Content-Type", "text/plain; charset=utf-8");
            response.end(
              error instanceof Error
                ? error.message
                : "YÖK Akademik profil proxy hatası",
            );
          }
        },
      );
    },
  };
}

async function fetchAcademicHtml(initialUrl: string): Promise<string> {
  const cookies = new Map<string, string>();
  const firstPageHtml = await fetchTextWithCookies(initialUrl, 8, cookies);
  const extraPageUrls = getAcademicPaginationUrls(firstPageHtml);
  if (extraPageUrls.length === 0) {
    return firstPageHtml;
  }

  const extraRows = (
    await Promise.all(
      extraPageUrls.map((pageUrl) =>
        fetchTextWithCookies(pageUrl, 8, cookies).then(extractAuthorRows),
      ),
    )
  ).join("");

  return extraRows
    ? firstPageHtml.replace("</tbody>", `${extraRows}</tbody>`)
    : firstPageHtml;
}

async function fetchTextWithCookies(
  initialUrl: string,
  redirectLimit = 8,
  cookies = new Map<string, string>(),
): Promise<string> {
  let currentUrl = initialUrl;

  for (let index = 0; index < redirectLimit; index += 1) {
    const response = await fetch(currentUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Cookie: [...cookies.values()].join("; "),
      },
      redirect: "manual",
    });

    collectCookies(response, cookies);

    if (
      response.status >= 300 &&
      response.status < 400 &&
      response.headers.get("location")
    ) {
      currentUrl = new URL(
        response.headers.get("location") ?? "",
        currentUrl,
      ).toString();
      continue;
    }

    return response.text();
  }

  throw new Error("YÖK Akademik yönlendirme limiti aşıldı.");
}

function getAcademicPaginationUrls(html: string): string[] {
  const urls = new Set<string>();
  const pageLinkPattern =
    /<li><a href="([^"]*\/AkademikArama\/AramaFiltrele\?islem=[^"]+)">\d+<\/a><\/li>/g;
  let match: RegExpExecArray | null;

  while ((match = pageLinkPattern.exec(html)) !== null) {
    urls.add(new URL(match[1], "https://akademik.yok.gov.tr").toString());
  }

  return [...urls];
}

function extractAuthorRows(html: string): string {
  return html.match(/<tbody>([\s\S]*?)<\/tbody>/i)?.[1] ?? "";
}

function collectCookies(
  response: Response,
  cookies: Map<string, string>,
): void {
  const headersWithCookies = response.headers as Headers & {
    getSetCookie?: () => string[];
  };
  const setCookies =
    headersWithCookies.getSetCookie?.() ??
    splitSetCookieHeader(response.headers.get("set-cookie"));

  setCookies.forEach((cookie) => {
    const pair = cookie.split(";")[0]?.trim();
    const name = pair?.split("=")[0];
    if (pair && name) {
      cookies.set(name, pair);
    }
  });
}

function splitSetCookieHeader(header: string | null): string[] {
  return header ? header.split(/,(?=\s*[^;,]+=)/) : [];
}

function readRequestBody(request: NodeJS.ReadableStream): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 200_000) {
        reject(new Error("İstek gövdesi çok büyük."));
      }
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

export default defineConfig({
  plugins: [react(), yokAtlasProxy()],
  server: {
    host: "127.0.0.1",
    port: 5173,
  },
});
