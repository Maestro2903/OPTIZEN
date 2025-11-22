# Model Context Protocol (MCP) Configuration

This project is configured to use Model Context Protocol (MCP) servers that allow AI assistants to interact with external tools and services.

## Configured MCP Servers

### 1. Figma Integration
- **Name**: Framelink MCP for Figma
- **Purpose**: Connect to Figma API for design operations
- **Authentication**: Uses Figma API key loaded from environment variables

### 2. Supabase Integration
- **Name**: Supabase
- **Purpose**: Connect to Supabase project for database and authentication operations
- **Project**: ${SUPABASE_PROJECT_ID} (set in environment variables)

## Security Requirements

⚠️ **Important Security Notice**: This configuration is a template only and should NOT contain real secrets. All sensitive information must be properly protected according to the following requirements:

### Secret Storage Location
- Secrets must be stored in environment variables or secure credential management systems
- Local secret files should follow the pattern `config/*.env` or `/etc/myapp/config.env`
- Production secrets should be managed through a secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.)

### Required Secret Loading
- All API keys and sensitive credentials must be loaded from:
  - Environment variables at runtime
  - A secrets manager service (e.g., AWS Secrets Manager, HashiCorp Vault, Azure Key Vault)
  - NOT from checked-in files or hardcoded values
- The configuration template should reference environment variables using placeholders

### Environment Configuration Template
This project uses `.env.local` for local development secrets (added to `.gitignore`).
Example template content is provided in `.env.example`.

## Deployment Security

### Secret Injection Practices
- Secrets must be injected at deployment time through the deployment platform's secret management system
- Never commit actual secrets to version control
- Use infrastructure-as-code tools (like Terraform) to manage secrets in production environments
- Secrets should be mounted as files or provided as environment variables in containers (Docker/Kubernetes)

### Access Control Recommendations
- Limit access to secrets to necessary team members only
- Implement role-based access control (RBAC) for secret management systems
- Regular access reviews should be conducted quarterly
- Developers should use temporary credentials with short expiry times when possible
- Production secrets should only be accessible by deployment systems and production services

### Secret Rotation Guidance
- Rotate API keys and other credentials regularly (recommended every 90 days for production)
- Implement monitoring to detect if credentials are compromised
- Maintain a documented process for emergency secret rotation
- Update secrets across all environments simultaneously during rotation
- Notify relevant team members when secrets are rotated

## Usage

AI assistants can use these MCP servers to:
- Access and manipulate Figma designs
- Perform database operations on the Supabase project
- Execute other configured tools and services

## Configuration Format

This configuration follows the Model Context Protocol specification for defining external tool connections.

## Configuration Examples

### JSON Format

Create a configuration file at `config/mcp.json` with the following structure:

```json
{
  "mcpServers": {
    "figma-mcp": {
      "type": "http",
      "url": "https://mcp.figma.com/mcp",
      "headers": {
        "Authorization": "Bearer ${FIGMA_ACCESS_TOKEN}",
        "Content-Type": "application/json"
      },
      "env": {
        "FIGMA_CLIENT_ID": "${FIGMA_CLIENT_ID}",
        "FIGMA_CLIENT_SECRET": "${FIGMA_CLIENT_SECRET}",
        "FIGMA_ACCESS_TOKEN": "${FIGMA_ACCESS_TOKEN}"
      },
      "version": "1.0.0",
      "description": "Official remote HTTP MCP (https://mcp.figma.com/mcp). Note: This is different from the community figma-developer-mcp stdio/npm package shown in the YAML example."
    },
    "supabase-mcp": {
      "type": "stdio",
      "command": "npx @supabase/mcp-server-supabase",
      "env": {
        "SUPABASE_PROJECT_ID": "${SUPABASE_PROJECT_ID}",
        "SUPABASE_SERVICE_ROLE_KEY": "${SUPABASE_SERVICE_ROLE_KEY}",
        "SUPABASE_ANON_KEY": "${SUPABASE_ANON_KEY}"
      },
      "version": "1.0.0",
      "description": "Stdio-based official Supabase MCP implementation using the npx @supabase/mcp-server-supabase command with environment-variable authentication."
    }
  }
}
```

> **Note**: Please verify the exact MCP configuration schema against the upstream Figma and Supabase MCP implementations before committing, as specifications may change over time.

### YAML Format

Alternatively, create `config/mcp.yaml`:

```yaml
mcpServers:
  figma-mcp:
    type: stdio
    command: npx
    args:
      - "-y"
      - "figma-developer-mcp"
      - "--figma-api-key=${FIGMA_API_KEY}"
      - "--stdio"
    env:
      FIGMA_API_KEY: "${FIGMA_API_KEY}"
    version: "1.0.0"

  supabase-mcp:
    type: http
    url: "https://${SUPABASE_PROJECT_ID}.supabase.co"
    headers:
      Authorization: "Bearer ${SUPABASE_SERVICE_ROLE_KEY}"
      Content-Type: "application/json"
    env:
      SUPABASE_PROJECT_ID: "${SUPABASE_PROJECT_ID}"
      SUPABASE_SERVICE_ROLE_KEY: "${SUPABASE_SERVICE_ROLE_KEY}"
    version: "1.0.0"
```

### Required Fields

- **type**: Either "stdio" for local processes or "http" for API endpoints
- **command/args**: For stdio servers that run as local commands
- **url/headers**: For http servers that connect to remote APIs
- **env**: Environment variables that reference secrets from secure storage
- **version**: Protocol version compatibility

### Secret Storage

All sensitive values (API keys, tokens, passwords) must be stored as:
- Environment variables (recommended for local development)
- Secret manager services (recommended for production)

Example `.env.local` entries:
```
FIGMA_API_KEY=
SUPABASE_PROJECT_ID=
SUPABASE_SERVICE_ROLE_KEY=
```
(Note: These values must be filled with actual secrets in a secure way and never committed to version control.)

### Configuration Location

Place the configuration file at one of these locations:
- `config/mcp.json` - JSON format (preferred)
- `config/mcp.yaml` - YAML format
- `.mcp.json` or `.mcp.yaml` - Dotfile format

The application will automatically detect and load the appropriate configuration file on startup.