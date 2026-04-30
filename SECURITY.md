# Security Guidelines

## Environment Variables

### Critical Rules

1. **NEVER** commit `.env.local` or any `.env` file to version control
2. **NEVER** hardcode secrets, API keys, or sensitive data in code
3. **ALWAYS** use environment variables for all sensitive configuration
4. **ALWAYS** validate that required environment variables are present on startup

### Setup Instructions

1. Copy `.env.example` to `.env.local`
2. Fill in all required values (DATABASE_URL, NEXTAUTH_SECRET, etc.)
3. For production, use a secrets management service or secure environment variable provider

### Generating NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

## API Security

### Rate Limiting

- All public endpoints have automatic rate limiting
- IP-based and user-based limiting is enforced
- Rate limit headers are returned with all responses
- 429 (Too Many Requests) is returned when limits are exceeded

### Client-Side Data Protection

- Never expose sensitive data in API responses to clients
- Use `serverConfig` from `@/lib/config.js` for server-side only data
- Always use `getServerSession` to verify user authentication
- Validate all user input server-side

### Authentication

- All protected routes require valid NextAuth session
- Passwords are hashed with bcryptjs
- Sessions use JWT tokens (secure)
- Session secret must be strong and randomly generated

## API Endpoints Classification

### Public Endpoints (Rate Limited)

- `GET /api/products` - Product listing
- `GET /api/reviews?productId=...` - Review listing (no auth required, but rate limited)

### Protected Endpoints (Auth Required + Rate Limited)

- `GET/POST /api/cart` - User cart management
- `GET/POST/DELETE /api/addresses` - User address management
- `GET/POST /api/orders` - User orders
- `POST /api/reviews` - Create review (must have delivered product)

## File Upload Security

### Rules

1. Validate file size before accepting (max: 5MB by default)
2. Convert all images to WebP format using sharp
3. Store files outside web root if possible
4. Never trust user-provided filenames
5. Implement virus scanning for production

### Implementation

- File uploads are processed server-side only
- Original files are converted to WebP
- Filenames are randomized for security

## Data Validation

### Input Validation

- All user inputs must be validated server-side
- Use strict type checking
- Validate file formats before processing
- Sanitize any output to prevent XSS

### Examples

```javascript
// ❌ WRONG - No validation
const email = req.body.email;

// ✅ CORRECT - Validated
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  return res.status(400).json({ error: "Invalid email" });
}
```

## Security Headers

The application implements these security headers:

- `X-Content-Type-Options: nosniff` - Prevent MIME type sniffing
- `X-Frame-Options: DENY` - Prevent clickjacking
- `X-XSS-Protection: 1; mode=block` - Enable XSS protection
- `Referrer-Policy: strict-origin-when-cross-origin` - Control referrer information
- `Permissions-Policy` - Disable unnecessary APIs
- `Cache-Control: no-store` - Prevent caching of API responses

## Session Security

- Session tokens are secure and httpOnly
- Sessions expire after 7 days by default
- Always verify session server-side before operations

## Error Handling

### Never Expose

- Database connection strings
- File paths or system information
- Internal error details in production
- Stack traces to clients

### Always Return

- Generic error messages to clients
- Detailed logs server-side for debugging
- Proper HTTP status codes

## Database Security

### Best Practices

1. Use parameterized queries (Prisma does this by default)
2. Validate all inputs before database operations
3. Use transactions for multi-step operations
4. Implement proper access controls per user

### Connection

- Store DATABASE_URL in environment variables
- Never use default credentials
- Use strong, random passwords
- Enable SSL/TLS for remote databases

## Testing Security

### Before Deployment

- [ ] All environment variables are set correctly
- [ ] No hardcoded secrets in code
- [ ] Rate limiting is working
- [ ] Auth checks on protected routes
- [ ] File uploads are properly validated
- [ ] Security headers are present

### Command

```bash
# Check for potential secrets in code
grep -r "password\|secret\|api_key\|token" src/ --exclude-dir=node_modules
```

## Incident Response

If a secret is accidentally committed:

1. Immediately revoke the compromised secret
2. Generate a new secret
3. Update environment variables
4. Force password reset for affected users
5. Review access logs
6. Rebase git history if needed

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/advanced-features/security-headers)
- [NextAuth.js Security](https://next-auth.js.org/getting-started/example)
