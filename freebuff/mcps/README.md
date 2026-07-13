# MCP (Model Context Protocol) Configurations

> This directory stores all Model Context Protocol server configurations, settings, and related documentation for the Freebuff project.

---

## What is MCP?

The **Model Context Protocol (MCP)** is an open standard that enables AI assistants to securely connect with external tools, data sources, and systems. Instead of each AI client requiring custom integration code for every service, MCP provides a universal protocol — AI clients connect to "MCP Servers" that expose standardized capabilities.

### Key Concepts

| Concept | Description |
|---------|-------------|
| **MCP Client** | The AI application (e.g., Claude Desktop, Cursor, Windsurf) |
| **MCP Server** | A lightweight program that exposes tools, resources, and prompts to the AI |
| **Tools** | Actions the AI can perform (e.g., read files, search the web, query a database) |
| **Resources** | Data the AI can read (e.g., files, API responses) |
| **Transports** | How the client and server communicate (stdio, HTTP/SSE) |

---

## Available Configurations

| Server | File | Description |
|--------|------|-------------|
| **All-in-One** | [`servers.json`](./servers.json) | Combined config with all MCP servers |
| **Filesystem** | [`examples/filesystem.json`](./examples/filesystem.json) | Local file system read/write access |
| **GitHub** | [`examples/github.json`](./examples/github.json) | Repository management, issues, PRs |
| **Brave Search** | [`examples/brave-search.json`](./examples/brave-search.json) | Web and local search |
| **Playwright** | [`examples/playwright.json`](./examples/playwright.json) | Browser automation & testing |
| **PostgreSQL** | [`examples/postgres.json`](./examples/postgres.json) | Database querying & schema inspection |
| **Fetch** | [`examples/fetch.json`](./examples/fetch.json) | Web page content retrieval |

---

## How to Use

### 1. Choose an MCP Client

The most common MCP clients are:

- **Claude Desktop** — configuration at `claude_desktop_config.json`
- **Cursor** — configuration in Cursor settings
- **Windsurf** — configuration in Windsurf settings
- **VS Code (via extension)** — GitHub Copilot or Continue.dev

### 2. Configure Your MCP Server

For **Claude Desktop** (macOS):
```json
// ~/Library/Application Support/Claude/claude_desktop_config.json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/path/to/your/project"
      ]
    }
  }
}
```

For **Claude Desktop** (Windows):
```json
// %APPDATA%\Claude\claude_desktop_config.json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "C:\\Path\\To\\Your\\Project"
      ]
    }
  }
}
```

### 3. Restart Your Client

After editing the configuration, **completely restart** your MCP client application. Connected servers typically appear as new capabilities (look for a hammer or plug icon).

### 4. Start Using It

Ask your AI assistant to use the connected tools:
- *"Read the files in my src directory"* → Filesystem server
- *"Search the web for React best practices"* → Brave Search server
- *"Query the users table in my database"* → PostgreSQL server

---

## Best Practices

### Security
- **Never hardcode API keys** in configuration files. Use environment variables or `.env` files.
- **Scope filesystem access** to only the directories you need.
- **Use read-only modes** when starting with database or filesystem servers.

### Performance
- **Enable only what you need.** Fewer servers means faster startup and less token overhead.
- **Use Docker for production** — Docker images provide environment isolation.
- **Use `npx` for prototyping** — fast and easy for local development.

### Configuration Tips
- Environment variables in `servers.json` are passed directly to the MCP server process.
- Some servers support `toolsets` — enable only the specific tools you need.
- Test each server individually before combining them in a single config.

---

## References

- [Official MCP Documentation](https://modelcontextprotocol.io/)
- [MCP Servers Directory](https://mcpservers.org/)
- [Official MCP GitHub Repository](https://github.com/modelcontextprotocol/servers)
- [Model Context Protocol Specification](https://spec.modelcontextprotocol.io/)

---

_Last updated: 2026-07-13_
