import http from "node:http";

const port = Number(process.env.MOCK_OPENAI_PORT || 9791);
const server = http.createServer(async (request, response) => {
  for await (const _chunk of request) {
    // Consume the request so this mock exercises the real transport path.
  }
  response.writeHead(200, { "Content-Type": "application/json" });
  response.end(JSON.stringify({
    output_text: JSON.stringify({
      response: "Orbit Cloud received your hotkey screen and found the first safe control.",
      steps: [
        { title: "Start here", detail: "This is the first visible control to use.", x: 260, y: 460 },
        { title: "Confirm the next change", detail: "Keep the action small and reversible.", x: 520, y: 600 }
      ]
    })
  }));
});

server.listen(port, "127.0.0.1");
process.once("SIGINT", () => server.close(() => process.exit(0)));
process.once("SIGTERM", () => server.close(() => process.exit(0)));
