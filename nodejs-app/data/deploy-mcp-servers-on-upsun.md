---
title: "Build and deploy AI-Native Applications with MCP Servers on Upsun"
subtitle: ""
date: 2025-06-05T07:00:00+00:00
image: /images/deploy-mcp-servers-on-upsun.png
icon: tutorial
featured: true
author:
  - gmoigneu

sidebar:
  exclude: true
type: post

description: |
  Learn how Model Context Protocol servers work with different transports and deploy them to Upsun for scalable AI-powered applications
  
tags:
  - ai
  - mcp
  - agent
  - nodejs
  - sse
  - streamable
categories:
  - tutorials
  - ai
math: false
# excludeSearch: true
---

The [Model Context Protocol (MCP)](https://modelcontextprotocol.io/introduction) is transforming how AI assistants interact with external tools and data sources. As AI becomes central to how users discover and interact with digital services, providing an MCP server is no longer optional – it's a strategic imperative for SaaS products and digital services.

{{< callout >}}
The full code of this tutorial, ready to deploy, [is available on Github](https://github.com/upsun/tutorial-mcp-deployment)!
{{< /callout >}}

## Why your product and company needs an MCP strategy

Consider how users increasingly rely on AI assistants for daily tasks. When they ask about your product, search for documentation, or need to interact with your API, they expect their AI assistant to have direct access to accurate, real-time information. Without an MCP server, your company becomes invisible to this growing segment of users.

MCP servers enable companies to:

**Control the AI Narrative**: Rather than letting AI assistants guess about your product based on outdated training data, provide authoritative, current information directly. Your MCP server becomes the single source of truth for AI interactions with your brand.

**Enhance Developer Experience**: Developers using AI assistants for coding can access your API documentation, code examples, and best practices instantly. An MCP wrapper around your product API transforms complex integrations into conversational experiences.

**Reduce Support Burden**: When AI assistants can query your documentation and knowledge base directly through MCP, they provide accurate answers to user questions, reducing support tickets and improving customer satisfaction.

**Enable New Use Cases**: MCP servers unlock possibilities you haven't imagined yet. From automated workflows to intelligent integrations, providing programmatic access to your services through MCP opens doors for innovation.

But deploying MCP servers presents unique challenges - from handling concurrent connections to managing different transport protocols. This article explores two MCP transport implementations and demonstrates how Upsun makes deploying these servers straightforward, allowing you to focus on building AI-powered features rather than managing infrastructure.

## Why HTTP transports beat stdio for SaaS apps

While MCP supports stdio transport for local development, HTTP-based transports like SSE and Streamable are the clear choice for SaaS businesses. Unlike stdio, which requires users to download and run servers locally, HTTP transports enable instant access through any AI assistant without installation friction.

### The power of hosted MCP servers

Hosting your MCP server as a service transforms it from a developer tool into a business asset:

**Zero Installation Barrier**: Users connect instantly without downloading binaries, managing dependencies, or dealing with compatibility issues. Your MCP server works everywhere the internet does.

**Integration Opportunities**: Hosted MCP servers can seamlessly connect to your internal systems, databases, and APIs without exposing them directly to end users.

**Continuous Updates**: Deploy improvements immediately to all users. When you enhance your API wrapper or update documentation access, everyone benefits instantly without manual updates.

**Built-in Observability**: Track usage patterns, monitor performance, and understand how AI assistants interact with your services. This data drives product decisions and identifies new opportunities.

**Security and Compliance**: Centralized hosting enables proper authentication, rate limiting, and audit trails. You maintain control over data access and can enforce your security policies consistently.

For SaaS businesses, the choice is clear: HTTP-based MCP servers deployed on platforms like Upsun provide the reliability, scalability, and control necessary to make MCP a core part of your product strategy.

## Understanding MCP transports: SSE vs Streamable

MCP servers communicate with AI assistants through transport protocols that handle the exchange of messages. While the [MCP specification](https://modelcontextprotocol.io/introduction) supports various transports, two HTTP-based approaches dominate the landscape: Server-Sent Events (SSE) and the newer Streamable transport.

### Server-Sent Events: The current standard

SSE represents the current default standard for MCP implementations. This transport uses traditional HTTP endpoints combined with event streams, providing a reliable way to maintain persistent connections between clients and servers. Despite being marked as deprecated in favor of newer approaches, SSE remains widely supported and battle-tested in production environments.

The SSE transport excels at:
- Maintaining persistent connections for real-time communication
- Supporting multiple concurrent clients through session management
- Providing clear separation between event streams and message handling
- Working seamlessly with existing web infrastructure

### Streamable: The future of MCP transports

The Streamable transport represents the next evolution in MCP communication. Built directly into the MCP SDK, it consolidates all communication through a single endpoint while maintaining the benefits of event-driven architecture. This streamlined approach reduces complexity and improves maintainability.

Streamable offers several advantages:
- Simplified architecture with a single `/mcp` endpoint
- Stateless operation that scales effortlessly
- Built-in SDK support reducing implementation complexity
- Automatic handling of connection lifecycle

While Streamable is positioned as the future standard, the transition is gradual. Many existing MCP implementations still rely on SSE, making it important to understand both approaches.

## Implementing an SSE-Based MCP Server

Let's examine how the SSE transport works by exploring our domain information server implementation. This server provides domain search capabilities through the domainsdb.info API, demonstrating real-world MCP usage.

### Core Architecture

The SSE implementation creates a stateful server that manages multiple client connections simultaneously using the [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk):

```typescript {filename="mcp-domains-sse/src/index.ts"}
class DomainsServer {
  private server: Server;
  
  constructor() {
    this.server = new Server({
      name: "domains-server",
      version: "1.0.0",
    }, {
      capabilities: {
        tools: {},
      },
    });
  }
}
```

### Session Management

One key aspect of the SSE transport is session management. Each client connection receives a unique session ID, enabling the server to route messages correctly:

```typescript {filename="mcp-domains-sse/src/index.ts"}
app.get('/sse', (req, res) => {
  const sessionId = crypto.randomUUID();
  const transport = new SSEServerTransport('/messages', res);
  
  sessions.set(sessionId, { transport, server: domainsServer });
  
  // Send endpoint information to client
  res.write(`event: endpoint\ndata: ${JSON.stringify({ 
    url: `/messages?sessionId=${sessionId}`,
    sessionId 
  })}\n\n`);
});
```

### Message Handling

Messages from clients arrive at a dedicated endpoint, where they're routed to the appropriate session:

```typescript {filename="mcp-domains-sse/src/index.ts"}
app.post('/messages', async (req, res) => {
  const sessionId = req.query.sessionId as string;
  const session = sessions.get(sessionId);
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  await session.transport.handleMessage(req.body);
  res.status(200).json({ ok: true });
});
```

This architecture provides excellent control over connection management and enables sophisticated features like connection pooling and custom routing logic.

## Implementing a Streamable MCP Server

The Streamable transport takes a different approach, leveraging the MCP SDK's built-in capabilities to reduce implementation complexity:

### Simplified Setup

With Streamable, the entire server setup becomes remarkably concise:

```typescript {filename="mcp-domains-streamable/src/index.ts"}
const transport = new StreamableHTTPServerTransport(
  new URL('/mcp', `http://localhost:${PORT}`),
  {}
);

const domainsServer = new DomainsServer();
await domainsServer.run(transport);
```

### Stateless operation

Unlike SSE, Streamable operates in a stateless mode. Each request creates a new server instance, eliminating session management complexity:

```typescript {filename="mcp-domains-streamable/src/index.ts"}
class DomainsServer {
  async run(transport: StreamableHTTPServerTransport): Promise<void> {
    await this.server.connect(transport);
    
    transport.handleRequestClose = () => {
      process.exit(0);  // Clean shutdown after each request
    };
  }
}
```

### Unified endpoint

All communication flows through a single `/mcp` endpoint, which handles both POST and GET requests:

```bash
# Client request with proper headers
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"method": "initialize", "params": {"capabilities": {}}}'
```

This unified approach aligns with modern API design principles and simplifies client implementation.

## Deploying MCP Servers on Upsun

Upsun transforms MCP server deployment from a complex infrastructure challenge into a straightforward Git push. The platform's multi-app architecture perfectly suits MCP deployments, where you might need different transports for different use cases.

### Multi-App configuration

Upsun's ability to run multiple applications within a single project shines when deploying both MCP transport variants. Here's how our configuration handles both servers:

```yaml {filename=".upsun/config.yaml"}
applications:
  mcp-domains-streamable:
    source:
      root: "mcp-domains-streamable"
    type: nodejs:22
    web:
      commands:
        start: "npm run start -- -p $PORT"
    hooks:
      build: |
        npm install
        npm run build
        
  mcp-domains-sse:
    source:
      root: "mcp-domains-sse"
    type: nodejs:22
    web:
      commands:
        start: "npm run start -- -p $PORT"
    hooks:
      build: |
        npm install
        npm run build
```

### Intelligent routing

Upsun's routing layer enables sophisticated traffic management without additional infrastructure:

```yaml {filename=".upsun/config.yaml"}
routes:
  "https://sse.{all}/": 
    type: upstream
    upstream: "mcp-domains-sse:http"
    
  "https://streamable.{all}/": 
    type: upstream
    upstream: "mcp-domains-streamable:http"
    
  "https://{all}/": 
    type: redirect
    to: "https://streamable.{all}/"
```

This configuration provides separate endpoints for each transport while maintaining a clean URL structure. The default route redirects to the Streamable implementation, acknowledging its position as the future standard.

### Preview environments for MCP development

One of Upsun's most powerful features for MCP development is preview environments. When you create a new Git branch, Upsun automatically provisions a complete environment - including both MCP servers:

```bash
# Create a feature branch
git checkout -b add-domain-filtering

# Make your changes to the MCP server
# ... edit code ...

# Push to create a preview environment
git push -u origin add-domain-filtering
```

Within minutes, you have a fully functional preview environment at `https://streamable.add-domain-filtering-abc123.preview.platformsh.site/`. This environment includes:
- Both MCP servers running with your changes
- Isolated from production
- Complete with all routing and configuration
- Ready for testing with your AI assistant

### Scaling and performance

Upsun handles scaling based on your resource allocation. For MCP servers, this means:

- **SSE deployments**: Can handle numerous persistent connections thanks to Node.js's event-driven architecture
- **Streamable deployments**: Scale effortlessly due to their stateless nature
- **Automatic resource optimization**: Upsun manages memory and CPU allocation based on actual usage

### Observability and monitoring

Deploying on Upsun provides built-in observability through Blackfire integration:

```yaml {filename=".upsun/config.yaml"}
applications:
  mcp-domains-streamable:
    runtime:
      extensions:
        - blackfire
```

This gives you:
- Performance profiling of MCP tool executions
- Resource usage tracking
- Response time analysis
- Bottleneck identification

## Best practices for MCP deployment

Successfully deploying MCP servers requires attention to several key areas:

### Security considerations

1. **API Key Management**: Store sensitive credentials in environment variables:
   ```bash
   upsun variable:create DOMAINS_API_KEY --level project --value "your-api-key"
   ```

2. **CORS Configuration**: Both implementations include proper CORS headers for browser-based clients

3. **Rate Limiting**: Implement appropriate rate limiting to prevent abuse

### Performance optimization

1. **Connection Pooling**: For SSE implementations, reuse HTTP connections where possible
2. **Caching**: Cache frequently requested data to reduce API calls
3. **Timeout Management**: Set appropriate timeouts for long-running operations

### Error handling

Both implementations include comprehensive error handling:

```typescript {filename="mcp-domains-streamable/src/index.ts"}
try {
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
} catch (error) {
  return {
    content: [{
      type: "text",
      text: `Error: ${error.message}`
    }],
    isError: true,
  };
}
```

## Conclusion

The Model Context Protocol represents a shift in how AI assistants interact with external systems. Whether you choose the current SSE transport or embrace the new Streamable approach, Upsun provides the perfect platform for deploying MCP servers.

With Upsun's Git-driven infrastructure, preview environments, and multi-app support, you can focus on building innovative AI integrations rather than managing deployment complexity. The platform handles scaling, monitoring, and infrastructure management, letting you iterate rapidly and deploy with confidence.

Ready to deploy your own MCP servers? [Create a free Upsun account](https://upsun.com) and have your first server running in minutes. For production deployments and enterprise features, [contact our team](https://upsun.com/contact-us/) to explore how Upsun can accelerate your AI integration journey.

**The future of AI-powered applications is here. Deploy it on Upsun.**