import * as mockttp from 'mockttp';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
    const app = express();
    const httpServer = createServer(app);
    const io = new Server(httpServer, { cors: { origin: "*" } });
    const PORT = 3000;

    app.use(express.json());

    // --- Proxy Logic ---
    // We create a MITM proxy. In a local Mac app context, you'd trust this CA.
    const proxy = mockttp.getLocal();
    let rules: any[] = [];

    const logTraffic = (data: any) => {
        io.emit('traffic', {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString(),
            ...data
        });
    };

    // Dynamic Rule Handling
    const updateProxyRules = async () => {
        await proxy.reset();
        
        // Default: Pass through and log
        await proxy.forAnyRequest().thenPassThrough({
            beforeRequest: (req) => {
                const rule = rules.find(r => req.url.includes(r.match) && r.active);
                if (rule) {
                    logTraffic({
                        type: 'intercept',
                        method: req.method,
                        url: req.url,
                        reroutedTo: rule.reroute,
                        headers: req.headers
                    });
                    // Reroute logic
                    return {
                        url: req.url.replace(new RegExp(rule.match, 'g'), rule.reroute)
                    };
                }
                logTraffic({
                    type: 'request',
                    method: req.method,
                    url: req.url,
                    headers: req.headers
                });
            },
            beforeResponse: (res) => {
                // Log response (truncated for performance)
                logTraffic({
                    type: 'response',
                    status: res.statusCode,
                    headers: res.headers
                });
            }
        });
    };

    await proxy.start(8080); // Proxy port
    console.log(`Proxy server running on port 8080`);

    // --- API Endpoints ---
    app.get('/api/rules', (req, res) => res.json(rules));
    app.post('/api/rules', async (req, res) => {
        rules = req.body;
        await updateProxyRules();
        res.json({ success: true });
    });

    // --- Vite / Frontend ---
    if (process.env.NODE_ENV !== "production") {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: "spa",
        });
        app.use(vite.middlewares);
    } else {
        const distPath = path.join(process.cwd(), "dist");
        app.use(express.static(distPath));
        app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
    }

    httpServer.listen(PORT, "0.0.0.0", () => {
        console.log(`Control UI running on http://localhost:${PORT}`);
    });
}

startServer();
