export interface DocSection {
  id: string;
  title: string;
  content: string;
  subsections?: DocSection[];
}

export const documentation: DocSection[] = [
  {
    id: "executive-summary",
    title: "Executive Summary",
    content: `This document explains how Xano's authentication system, particularly its **Extras** (custom claims in JWE tokens), integrates with Shopify's OIDC-based federated login architecture. The integration leverages Xano as a middleware orchestration layer that bridges user authentication, custom claims management, and Shopify's customer identity system.`
  },
  {
    id: "architecture-overview",
    title: "Architecture Overview",
    content: `In a federated login scenario involving Xano and Shopify, the architecture follows a **three-tier model**:

\`\`\`
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Webflow   │ ◄─────► │    Xano     │ ◄─────► │   Shopify   │
│  (Frontend) │         │ (Middleware)│         │    (CRM)    │
│   Ledger    │         │   + Auth    │         │  + Commerce │
└─────────────┘         └─────────────┘         └─────────────┘
\`\`\`

**Key roles:**
- **Webflow:** Frontend presentation layer and central ledger for user state
- **Xano:** Middleware orchestration, authentication service, and API gateway
- **Shopify:** Commerce engine, CRM, and customer data repository`
  },
  {
    id: "components",
    title: "Understanding the Components",
    content: "",
    subsections: [
      {
        id: "xano-extras",
        title: "Xano Extras (Custom Claims)",
        content: `Xano's **Extras** are custom claims embedded within JWE (JSON Web Encryption) tokens during the authentication process. Unlike standard JWT claims (sub, iss, exp), Extras allow you to store application-specific data securely within the encrypted token.

**Common Extras include:**
- User role (admin, customer, guest)
- Tenant ID (for multi-tenant applications)
- Shopify Customer ID
- Consent status
- Segment assignment (A/B testing)
- Lifetime value (LTV)
- Custom permissions

**Security characteristics:**
- Encrypted within the JWE token
- Not readable without decryption
- Tamper-proof (any modification invalidates the token)
- Available for authorization decisions without database queries`
      },
      {
        id: "shopify-oidc",
        title: "Shopify OIDC Implementation",
        content: `Shopify Plus merchants can connect an **OIDC-compliant identity provider** to replace the default customer login experience. This enables:

- Single Sign-On (SSO) across multiple stores
- Centralized identity management
- Custom authentication flows
- Integration with enterprise identity providers (Auth0, Okta, Azure AD)

**OIDC requirements for Shopify:**
- OAuth 2.0 Authorization Code Flow
- Discovery endpoint: \`/.well-known/openid-configuration\`
- ID tokens with standard claims (sub, email, email_verified, etc.)
- Token endpoint with client authentication`
      }
    ]
  },
  {
    id: "integration-pattern",
    title: "Integration Pattern: Xano as OIDC Provider",
    content: `While Xano is not a traditional OIDC provider out-of-the-box, it can be **configured to act as one** by implementing the required OIDC endpoints and flows.`,
    subsections: [
      {
        id: "architecture-flow",
        title: "Architecture Flow",
        content: `\`\`\`
1. User Login Request
   ↓
2. Shopify redirects to Xano (OIDC Authorization Endpoint)
   ↓
3. Xano authenticates user (validates credentials)
   ↓
4. Xano generates JWE token with Extras
   ↓
5. Xano returns Authorization Code to Shopify
   ↓
6. Shopify exchanges code for tokens (Token Endpoint)
   ↓
7. Xano returns ID Token + Access Token
   ↓
8. Shopify validates ID Token and creates customer session
   ↓
9. Xano syncs custom claims to Shopify Metaobjects
\`\`\``
      },
      {
        id: "step-1",
        title: "Step 1: Configure Xano as OIDC Provider",
        content: `Create custom API endpoints in Xano to implement OIDC specification:

**Required endpoints:**
- **Authorization Endpoint:** \`/oauth/authorize\`
- **Token Endpoint:** \`/oauth/token\`
- **UserInfo Endpoint:** \`/oauth/userinfo\`
- **Discovery Endpoint:** \`/.well-known/openid-configuration\`

**Discovery endpoint response (JSON):**
\`\`\`json
{
  "issuer": "https://your-xano-instance.xano.io",
  "authorization_endpoint": "https://your-xano-instance.xano.io/oauth/authorize",
  "token_endpoint": "https://your-xano-instance.xano.io/oauth/token",
  "userinfo_endpoint": "https://your-xano-instance.xano.io/oauth/userinfo",
  "jwks_uri": "https://your-xano-instance.xano.io/.well-known/jwks.json",
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code", "refresh_token"],
  "subject_types_supported": ["public"],
  "id_token_signing_alg_values_supported": ["RS256"],
  "scopes_supported": ["openid", "email", "profile"]
}
\`\`\``
      },
      {
        id: "step-2",
        title: "Step 2: Implement Authorization Endpoint",
        content: `**Xano function logic:**
1. Receive authorization request from Shopify
2. Validate client_id and redirect_uri
3. Present login form to user (or auto-authenticate if session exists)
4. Generate authorization code
5. Store code with associated user data and Extras
6. Redirect back to Shopify with authorization code

**Extras to include at this stage:**
\`\`\`json
{
  "user_role": "customer",
  "shopify_customer_id": "gid://shopify/Customer/123456789",
  "consent_status": "granted",
  "segment": "premium",
  "lifetime_value": 5000,
  "tenant_id": "store_abc"
}
\`\`\``
      },
      {
        id: "step-3",
        title: "Step 3: Implement Token Endpoint",
        content: `**Xano function logic:**
1. Receive token exchange request from Shopify
2. Validate authorization code
3. Authenticate client (client_id + client_secret)
4. Generate ID Token (JWT) with standard OIDC claims
5. Generate Access Token (for UserInfo endpoint)
6. Include Extras as custom claims in ID Token
7. Return tokens to Shopify

**ID Token structure:**
\`\`\`json
{
  "iss": "https://your-xano-instance.xano.io",
  "sub": "user_1234567890_abc123",
  "aud": "shopify_client_id",
  "exp": 1707580800,
  "iat": 1707577200,
  "email": "customer@example.com",
  "email_verified": true,
  "name": "John Doe",
  
  // Custom claims from Xano Extras
  "user_role": "customer",
  "shopify_customer_id": "gid://shopify/Customer/123456789",
  "consent_status": "granted",
  "segment": "premium",
  "lifetime_value": 5000,
  "tenant_id": "store_abc"
}
\`\`\``
      },
      {
        id: "step-4",
        title: "Step 4: Map Xano Extras to Shopify Customer Data",
        content: `Once Shopify receives the ID Token, the custom claims (Xano Extras) need to be synchronized to Shopify's customer record using **Shopify Metaobjects**.

**Xano webhook function (triggered after successful authentication):**
1. Decode ID Token to extract Extras
2. Use Xano Shopify Actions to update customer record
3. Update Shopify Metaobjects with custom claims

**Shopify Metaobject structure:**
\`\`\`
Metaobject Definition: "User Profile"

Fields:
- consent_status (single_line_text)
- segment (single_line_text)
- lifetime_value (number_decimal)
- user_role (single_line_text)
- last_sync (date_time)
\`\`\`

**Xano function to sync:**
\`\`\`javascript
// Xano webhook: Sync to Shopify
const shopifyCustomerId = extras.shopify_customer_id;

// Update Shopify Metaobject via GraphQL
const mutation = \\\`
  mutation UpdateCustomerMetafields($input: CustomerInput!) {
    customerUpdate(input: $input) {
      customer {
        id
        metafields(first: 10) {
          edges {
            node {
              namespace
              key
              value
            }
          }
        }
      }
    }
  }
\\\`;

const variables = {
  input: {
    id: shopifyCustomerId,
    metafields: [
      { namespace: "custom", key: "consent_status", value: extras.consent_status },
      { namespace: "custom", key: "segment", value: extras.segment },
      { namespace: "custom", key: "lifetime_value", value: extras.lifetime_value.toString() },
      { namespace: "custom", key: "user_role", value: extras.user_role }
    ]
  }
};

executeShopifyGraphQL(mutation, variables);
\`\`\``
      }
    ]
  },
  {
    id: "data-flow",
    title: "Data Flow: User Login with Extras",
    content: `Let's trace a complete user login flow showing how Xano Extras integrate with Shopify OIDC:

**Step 1: Customer clicks "Sign In"**
- Shopify redirects to Xano authorization endpoint
- URL: \`https://xano.io/oauth/authorize?client_id=shopify&redirect_uri=https://store.myshopify.com/callback&response_type=code&scope=openid+email+profile\`

**Step 2: Xano authenticates user**
- User enters credentials
- Xano validates password (hashed in database)
- Xano retrieves user record from database

**Step 3: Xano generates authorization code with Extras**
\`\`\`javascript
// Xano function: Create Authorization Code
const extras = {
  user_role: user.role,
  shopify_customer_id: user.shopify_id,
  consent_status: user.consent_status,
  segment: user.segment,
  lifetime_value: user.ltv
};

const authCode = generateAuthCode(user.id, extras);
storeAuthCode(authCode, user.id, extras);
\`\`\`

**Step 4-9:** Continue through token exchange, validation, session creation, and Metaobject sync.`
  },
  {
    id: "ucp-integration",
    title: "Integration with Universal Commerce Protocol (UCP)",
    content: `When integrating with UCP, Xano Extras play a critical role in maintaining user state across the commerce ecosystem.

**Xano Extras for UCP:**
\`\`\`json
{
  "ucp_session_id": "session_abc123",
  "customer_id": "gid://shopify/Customer/123456789",
  "consent_history": {
    "marketing": "granted",
    "analytics": "granted",
    "timestamp": "2026-02-10T12:00:00Z"
  },
  "segment": "premium",
  "lifetime_value": 5000,
  "user_tags": ["vip", "repeat_buyer"]
}
\`\`\`

**Consent Management Flow:**
\`\`\`
User grants consent on Webflow
  ↓
JavaScript listener sends to Xano websocket
  ↓
Xano updates user record + generates new JWE with updated Extras
  ↓
Xano webhooks to Shopify (update Metaobjects)
  ↓
Xano webhooks to Webflow (update Collections)
  ↓
Xano streams to Google UCP (update targeting)
\`\`\``
  },
  {
    id: "security",
    title: "Security Considerations",
    content: "",
    subsections: [
      {
        id: "encryption",
        title: "Encrypting Sensitive Extras",
        content: `Xano uses **JWE (JSON Web Encryption)** for tokens, ensuring Extras are encrypted and not just base64-encoded like standard JWTs.

**Security benefits:**
- Extras are **encrypted**, not just signed
- Only Xano can decrypt the token payload
- Prevents token inspection by intermediate parties
- Complies with GDPR/PCI-DSS for sensitive data`
      },
      {
        id: "validation",
        title: "Validating Extras in Shopify",
        content: `When Shopify receives an ID Token with custom claims (Extras), it should:

1. **Validate token signature** using Xano's public key
2. **Verify standard claims** (iss, aud, exp)
3. **Sanitize custom claims** before storing in Metaobjects
4. **Implement claim validation logic** (e.g., user_role must be in allowed list)`
      },
      {
        id: "idempotency",
        title: "Idempotency for Sync Operations",
        content: `When syncing Xano Extras to Shopify Metaobjects, implement **idempotency checks** to prevent duplicate processing:

\`\`\`javascript
// Xano function: Idempotent sync
const syncKey = \\\`\${user_id}_\${timestamp}\\\`;
const existingSync = checkSyncRecord(syncKey);

if (existingSync) {
  return { status: "already_synced" };
}

// Perform sync
updateShopifyMetaobjects(extras);
recordSync(syncKey);
\`\`\``
      }
    ]
  },
  {
    id: "practical-example",
    title: "Practical Implementation Example",
    content: `**Use Case:** Premium Customer Segmentation

**Goal:** Identify premium customers (LTV > $1000) and provide personalized checkout experience in Shopify.

**Implementation Steps:**

1. **Xano: Calculate LTV and store in Extras**
\`\`\`javascript
const user = authenticateUser(email, password);
const ltv = calculateLifetimeValue(user.id);
const segment = ltv > 1000 ? "premium" : "standard";

const extras = {
  lifetime_value: ltv,
  segment: segment,
  user_role: "customer",
  shopify_customer_id: user.shopify_id
};

const authToken = createAuthenticationToken(user.id, extras);
\`\`\`

2. **Xano: Generate OIDC ID Token with Extras**
3. **Shopify: Receive ID Token and extract Extras**
4. **Xano: Sync Extras to Shopify Metaobjects**
5. **Shopify: Use Metaobjects in checkout for personalization**`
  },
  {
    id: "summary",
    title: "Summary: Integration Architecture",
    content: `| Component | Role | Data Flow |
|:----------|:-----|:----------|
| **Xano Extras** | Store custom claims in encrypted JWE token | User login → Xano generates token with Extras |
| **OIDC ID Token** | Transport user identity + custom claims to Shopify | Xano → Shopify (ID Token with Extras as claims) |
| **Shopify Metaobjects** | Persist custom claims for use in commerce flows | Xano webhook → Shopify GraphQL → Metaobjects updated |
| **Webflow Collections** | Central ledger for user state and consent | Xano webhook → Webflow API → Collections updated |
| **UCP Session** | Enable retargeting and agentic commerce | Xano → Google UCP API → Session/Customer ID synced |

**Key Takeaways:**

1. **Xano Extras are custom claims** embedded in JWE tokens, providing encrypted, tamper-proof user metadata.

2. **Shopify OIDC accepts custom claims** in ID tokens, allowing Xano Extras to be transmitted during federated login.

3. **Xano acts as middleware** orchestrating authentication, claim generation, and data synchronization across Webflow, Shopify, and UCP.

4. **Shopify Metaobjects persist Extras** for use in checkout, customer accounts, and marketing personalization.

5. **Security is maintained** through JWE encryption, token validation, and idempotency checks.

6. **Real-time sync** enables dynamic user segmentation, consent management, and personalized commerce experiences.`
  }
];
