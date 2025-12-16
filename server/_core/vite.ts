import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      
      // Replace environment variables in HTML template BEFORE Vite processing
      const analyticsEndpoint = process.env.VITE_ANALYTICS_ENDPOINT || "";
      const analyticsWebsiteId = process.env.VITE_ANALYTICS_WEBSITE_ID || "";
      
      // Replace or remove analytics script if environment variables are not set
      if (analyticsEndpoint && analyticsWebsiteId) {
        template = template.replace(
          /%VITE_ANALYTICS_ENDPOINT%/g,
          analyticsEndpoint
        );
        template = template.replace(
          /%VITE_ANALYTICS_WEBSITE_ID%/g,
          analyticsWebsiteId
        );
      } else {
        // Remove the analytics script tag if environment variables are not set
        // Use a more specific pattern to match only the analytics script
        template = template.replace(
          /<script\s+defer[\s\S]*?src="%VITE_ANALYTICS_ENDPOINT%\/umami"[\s\S]*?data-website-id="%VITE_ANALYTICS_WEBSITE_ID%"[\s\S]*?><\/script>/g,
          ""
        );
        // Also handle the case where placeholders were already replaced with empty strings
        template = template.replace(
          /<script\s+defer[\s\S]*?src="\/umami"[\s\S]*?data-website-id=""[\s\S]*?><\/script>/g,
          ""
        );
      }
      
      // Let Vite transform the HTML (this will process the main.tsx script tag)
      let page = await vite.transformIndexHtml(url, template);
      
      // Ensure main.tsx script tag exists - always check and add if missing
      // Check if main.tsx script tag exists (could be /src/main.tsx or transformed path)
      const hasMainScript = /src="[^"]*main\.tsx[^"]*"/.test(page);
      
      if (!hasMainScript) {
        // Find the closing body tag and insert the script before it
        const bodyCloseIndex = page.lastIndexOf('</body>');
        if (bodyCloseIndex !== -1) {
          const scriptTag = `    <script type="module" src="/src/main.tsx"></script>\n`;
          page = page.slice(0, bodyCloseIndex) + scriptTag + page.slice(bodyCloseIndex);
        } else {
          // If no </body> tag, append to the end
          page += `    <script type="module" src="/src/main.tsx"></script>\n`;
        }
      }
      
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      console.error("Error processing HTML template:", e);
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
