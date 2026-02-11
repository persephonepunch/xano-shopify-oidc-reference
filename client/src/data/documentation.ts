export interface DocSection {
  id: string;
  title: string;
  content: string;
  subsections?: DocSection[];
}

export const documentation: DocSection[] = [
  {
    "id": "executive-summary",
    "title": "Executive Summary",
    "content": "This document explains how Xano's authentication system, particularly its **Extras** (custom claims in JWE tokens), integrates with Shopify's OIDC-based federated login architecture. The integration leverages Xano as a middleware orchestration layer that bridges user authentication, custom claims management, and Shopify's customer identity system.",
    "subsections": []
  },
  {
    "id": "architecture-overview",
    "title": "Architecture Overview",
    "content": "In a federated login scenario involving Xano and Shopify, the architecture follows a **three-tier model**:\n\n```\n\u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510         \u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510         \u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510\n\u2502   Webflow   \u2502 \u25c4\u2500\u2500\u2500\u2500\u2500\u25ba \u2502    Xano     \u2502 \u25c4\u2500\u2500\u2500\u2500\u2500\u25ba \u2502   Shopify   \u2502\n\u2502  (Frontend) \u2502         \u2502 (Middleware)\u2502         \u2502    (CRM)    \u2502\n\u2502   Ledger    \u2502         \u2502   + Auth    \u2502         \u2502  + Commerce \u2502\n\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518         \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518         \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518\n```\n\n**Key roles:**\n- **Webflow:** Frontend presentation layer and central ledger for user state\n- **Xano:** Middleware orchestration, authentication service, and API gateway\n- **Shopify:** Commerce engine, CRM, and customer data repository",
    "subsections": []
  },
  {
    "id": "understanding-the-components",
    "title": "Understanding the Components",
    "content": "",
    "subsections": [
      {
        "id": "xano-extras-custom-claims",
        "title": "Xano Extras (Custom Claims)",
        "content": "Xano's **Extras** are custom claims embedded within JWE (JSON Web Encryption) tokens during the authentication process [1]. Unlike standard JWT claims (sub, iss, exp), Extras allow you to store application-specific data securely within the encrypted token.\n\n**Common Extras include:**\n- User role (admin, customer, guest)\n- Tenant ID (for multi-tenant applications)\n- Shopify Customer ID\n- Consent status\n- Segment assignment (A/B testing)\n- Lifetime value (LTV)\n- Custom permissions\n\n**Security characteristics:**\n- Encrypted within the JWE token\n- Not readable without decryption\n- Tamper-proof (any modification invalidates the token)\n- Available for authorization decisions without database queries"
      },
      {
        "id": "shopify-oidc-implementation",
        "title": "Shopify OIDC Implementation",
        "content": "Shopify Plus merchants can connect an **OIDC-compliant identity provider** to replace the default customer login experience [2]. This enables:\n\n- Single Sign-On (SSO) across multiple stores\n- Centralized identity management\n- Custom authentication flows\n- Integration with enterprise identity providers (Auth0, Okta, Azure AD)\n\n**OIDC requirements for Shopify:**\n- OAuth 2.0 Authorization Code Flow\n- Discovery endpoint: `/.well-known/openid-configuration`\n- ID tokens with standard claims (sub, email, email_verified, etc.)\n- Token endpoint with client authentication"
      }
    ]
  },
  {
    "id": "integration-pattern-xano-as-oidc-provider-for-shopify",
    "title": "Integration Pattern: Xano as OIDC Provider for Shopify",
    "content": "",
    "subsections": [
      {
        "id": "architecture-flow",
        "title": "Architecture Flow",
        "content": "```\n1. User Login Request\n   \u2193\n2. Shopify redirects to Xano (OIDC Authorization Endpoint)\n   \u2193\n3. Xano authenticates user (validates credentials)\n   \u2193\n4. Xano generates JWE token with Extras\n   \u2193\n5. Xano returns Authorization Code to Shopify\n   \u2193\n6. Shopify exchanges code for tokens (Token Endpoint)\n   \u2193\n7. Xano returns ID Token + Access Token\n   \u2193\n8. Shopify validates ID Token and creates customer session\n   \u2193\n9. Xano syncs custom claims to Shopify Metaobjects\n```"
      },
      {
        "id": "step-by-step-integration",
        "title": "Step-by-Step Integration",
        "content": "#### Step 1: Configure Xano as OIDC Provider\n\nCreate custom API endpoints in Xano to implement OIDC specification:\n\n**Required endpoints:**\n- **Authorization Endpoint:** `/oauth/authorize`\n- **Token Endpoint:** `/oauth/token`\n- **UserInfo Endpoint:** `/oauth/userinfo`\n- **Discovery Endpoint:** `/.well-known/openid-configuration`\n\n**Discovery endpoint response (JSON):**\n```json\n{\n  \"issuer\": \"https://your-xano-instance.xano.io\",\n  \"authorization_endpoint\": \"https://your-xano-instance.xano.io/oauth/authorize\",\n  \"token_endpoint\": \"https://your-xano-instance.xano.io/oauth/token\",\n  \"userinfo_endpoint\": \"https://your-xano-instance.xano.io/oauth/userinfo\",\n  \"jwks_uri\": \"https://your-xano-instance.xano.io/.well-known/jwks.json\",\n  \"response_types_supported\": [\"code\"],\n  \"grant_types_supported\": [\"authorization_code\", \"refresh_token\"],\n  \"subject_types_supported\": [\"public\"],\n  \"id_token_signing_alg_values_supported\": [\"RS256\"],\n  \"scopes_supported\": [\"openid\", \"email\", \"profile\"]\n}\n```\n\n#### Step 2: Implement Authorization Endpoint\n\n**Xano function logic:**\n1. Receive authorization request from Shopify\n2. Validate client_id and redirect_uri\n3. Present login form to user (or auto-authenticate if session exists)\n4. Generate authorization code\n5. Store code with associated user data and Extras\n6. Redirect back to Shopify with authorization code\n\n**Extras to include at this stage:**\n```json\n{\n  \"user_role\": \"customer\",\n  \"shopify_customer_id\": \"gid://shopify/Customer/123456789\",\n  \"consent_status\": \"granted\",\n  \"segment\": \"premium\",\n  \"lifetime_value\": 5000,\n  \"tenant_id\": \"store_abc\"\n}\n```\n\n#### Step 3: Implement Token Endpoint\n\n**Xano function logic:**\n1. Receive token exchange request from Shopify\n2. Validate authorization code\n3. Authenticate client (client_id + client_secret)\n4. Generate ID Token (JWT) with standard OIDC claims\n5. Generate Access Token (for UserInfo endpoint)\n6. Include Extras as custom claims in ID Token\n7. Return tokens to Shopify\n\n**ID Token structure:**\n```json\n{\n  \"iss\": \"https://your-xano-instance.xano.io\",\n  \"sub\": \"user_1234567890_abc123\",\n  \"aud\": \"shopify_client_id\",\n  \"exp\": 1707580800,\n  \"iat\": 1707577200,\n  \"email\": \"customer@example.com\",\n  \"email_verified\": true,\n  \"name\": \"John Doe\",\n  \n  // Custom claims from Xano Extras\n  \"user_role\": \"customer\",\n  \"shopify_customer_id\": \"gid://shopify/Customer/123456789\",\n  \"consent_status\": \"granted\",\n  \"segment\": \"premium\",\n  \"lifetime_value\": 5000,\n  \"tenant_id\": \"store_abc\"\n}\n```\n\n#### Step 4: Map Xano Extras to Shopify Customer Data\n\nOnce Shopify receives the ID Token, the custom claims (Xano Extras) need to be synchronized to Shopify's customer record. This is accomplished using **Shopify Metaobjects** [3].\n\n**Xano webhook function (triggered after successful authentication):**\n1. Decode ID Token to extract Extras\n2. Use Xano Shopify Actions to update customer record\n3. Update Shopify Metaobjects with custom claims\n\n**Shopify Metaobject structure:**\n```\nMetaobject Definition: \"User Profile\"\n\nFields:\n- consent_status (single_line_text)\n- segment (single_line_text)\n- lifetime_value (number_decimal)\n- user_role (single_line_text)\n- last_sync (date_time)\n```\n\n**Xano function to sync:**\n```\n1. External API Request \u2192 Shopify GraphQL API\n2. Mutation: customerUpdate\n3. Update metafields with Extras data\n4. Store sync timestamp\n```"
      }
    ]
  },
  {
    "id": "data-flow-user-login-with-extras",
    "title": "Data Flow: User Login with Extras",
    "content": "",
    "subsections": [
      {
        "id": "scenario-customer-login-on-shopify-store",
        "title": "Scenario: Customer Login on Shopify Store",
        "content": "**Step 1: Customer clicks \"Sign In\"**\n- Shopify redirects to Xano authorization endpoint\n- URL: `https://xano.io/oauth/authorize?client_id=shopify&redirect_uri=https://store.myshopify.com/callback&response_type=code&scope=openid+email+profile`\n\n**Step 2: Xano authenticates user**\n- User enters credentials\n- Xano validates password (hashed in database)\n- Xano retrieves user record from database\n\n**Step 3: Xano generates authorization code with Extras**\n```javascript\n// Xano function: Create Authorization Code\nconst extras = {\n  user_role: user.role,\n  shopify_customer_id: user.shopify_id,\n  consent_status: user.consent_status,\n  segment: user.segment,\n  lifetime_value: user.ltv\n};\n\nconst authCode = generateAuthCode(user.id, extras);\nstoreAuthCode(authCode, user.id, extras);\n```\n\n**Step 4: Redirect to Shopify with code**\n- URL: `https://store.myshopify.com/callback?code=AUTH_CODE_123`\n\n**Step 5: Shopify exchanges code for tokens**\n- Shopify sends POST request to Xano token endpoint\n- Request includes: code, client_id, client_secret, grant_type\n\n**Step 6: Xano generates ID Token with Extras as claims**\n```javascript\n// Xano function: Generate ID Token\nconst authCodeData = retrieveAuthCode(code);\nconst user = getUser(authCodeData.user_id);\nconst extras = authCodeData.extras;\n\nconst idToken = createJWT({\n  iss: \"https://xano.io\",\n  sub: user.id,\n  aud: client_id,\n  exp: now() + 3600,\n  email: user.email,\n  email_verified: user.email_verified,\n  \n  // Extras as custom claims\n  ...extras\n});\n\nreturn {\n  id_token: idToken,\n  access_token: generateAccessToken(user.id),\n  token_type: \"Bearer\",\n  expires_in: 3600\n};\n```\n\n**Step 7: Shopify validates ID Token**\n- Verifies signature using Xano's public key (from JWKS endpoint)\n- Validates issuer, audience, expiration\n- Extracts standard claims (email, sub) and custom claims (Extras)\n\n**Step 8: Shopify creates customer session**\n- Maps `sub` claim to Shopify customer ID\n- If customer doesn't exist, creates new customer record\n- Stores custom claims for use in checkout/account pages\n\n**Step 9: Xano syncs Extras to Shopify Metaobjects**\n```javascript\n// Xano webhook: Sync to Shopify\nconst shopifyCustomerId = extras.shopify_customer_id;\n\n// Update Shopify Metaobject via GraphQL\nconst mutation = `\n  mutation UpdateCustomerMetafields($input: CustomerInput!) {\n    customerUpdate(input: $input) {\n      customer {\n        id\n        metafields(first: 10) {\n          edges {\n            node {\n              namespace\n              key\n              value\n            }\n          }\n        }\n      }\n    }\n  }\n`;\n\nconst variables = {\n  input: {\n    id: shopifyCustomerId,\n    metafields: [\n      { namespace: \"custom\", key: \"consent_status\", value: extras.consent_status },\n      { namespace: \"custom\", key: \"segment\", value: extras.segment },\n      { namespace: \"custom\", key: \"lifetime_value\", value: extras.lifetime_value.toString() },\n      { namespace: \"custom\", key: \"user_role\", value: extras.user_role }\n    ]\n  }\n};\n\nexecuteShopifyGraphQL(mutation, variables);\n```"
      }
    ]
  },
  {
    "id": "integration-with-universal-commerce-protocol-ucp",
    "title": "Integration with Universal Commerce Protocol (UCP)",
    "content": "",
    "subsections": [
      {
        "id": "ucp-session-management",
        "title": "UCP Session Management",
        "content": "**Xano Extras for UCP:**\n```json\n{\n  \"ucp_session_id\": \"session_abc123\",\n  \"customer_id\": \"gid://shopify/Customer/123456789\",\n  \"consent_history\": {\n    \"marketing\": \"granted\",\n    \"analytics\": \"granted\",\n    \"timestamp\": \"2026-02-10T12:00:00Z\"\n  },\n  \"segment\": \"premium\",\n  \"lifetime_value\": 5000,\n  \"user_tags\": [\"vip\", \"repeat_buyer\"]\n}\n```\n\n**Flow:**\n1. User submits marketing form on Webflow\n2. Form POSTs to Xano endpoint\n3. Xano creates/updates user record with consent data\n4. Xano generates JWE token with Extras (including consent)\n5. Xano triggers webhook to update Shopify Metaobjects\n6. Xano streams data to Google UCP via API\n7. UCP uses session_id and customer_id for retargeting"
      },
      {
        "id": "consent-management-with-extras",
        "title": "Consent Management with Extras",
        "content": "Xano Extras enable **real-time consent tracking** across the commerce stack:\n\n**Consent capture flow:**\n```\nUser grants consent on Webflow\n  \u2193\nJavaScript listener sends to Xano websocket\n  \u2193\nXano updates user record + generates new JWE with updated Extras\n  \u2193\nXano webhooks to Shopify (update Metaobjects)\n  \u2193\nXano webhooks to Webflow (update Collections)\n  \u2193\nXano streams to Google UCP (update targeting)\n```\n\n**Xano Extras for consent:**\n```json\n{\n  \"consent_marketing\": true,\n  \"consent_analytics\": true,\n  \"consent_timestamp\": \"2026-02-10T12:00:00Z\",\n  \"consent_source\": \"https://example.com/pricing\",\n  \"gdpr_compliant\": true\n}\n```"
      }
    ]
  },
  {
    "id": "security-considerations",
    "title": "Security Considerations",
    "content": "",
    "subsections": [
      {
        "id": "encrypting-sensitive-extras",
        "title": "Encrypting Sensitive Extras",
        "content": "Xano uses **JWE (JSON Web Encryption)** for tokens, ensuring Extras are encrypted and not just base64-encoded like standard JWTs [4].\n\n**Security benefits:**\n- Extras are **encrypted**, not just signed\n- Only Xano can decrypt the token payload\n- Prevents token inspection by intermediate parties\n- Complies with GDPR/PCI-DSS for sensitive data"
      },
      {
        "id": "validating-extras-in-shopify",
        "title": "Validating Extras in Shopify",
        "content": "When Shopify receives an ID Token with custom claims (Extras), it should:\n\n1. **Validate token signature** using Xano's public key\n2. **Verify standard claims** (iss, aud, exp)\n3. **Sanitize custom claims** before storing in Metaobjects\n4. **Implement claim validation logic** (e.g., user_role must be in allowed list)"
      },
      {
        "id": "idempotency-for-sync-operations",
        "title": "Idempotency for Sync Operations",
        "content": "When syncing Xano Extras to Shopify Metaobjects, implement **idempotency checks** to prevent duplicate processing [5]:\n\n```javascript\n// Xano function: Idempotent sync\nconst syncKey = `${user_id}_${timestamp}`;\nconst existingSync = checkSyncRecord(syncKey);\n\nif (existingSync) {\n  return { status: \"already_synced\" };\n}\n\n// Perform sync\nupdateShopifyMetaobjects(extras);\nrecordSync(syncKey);\n```"
      }
    ]
  },
  {
    "id": "practical-implementation-example",
    "title": "Practical Implementation Example",
    "content": "",
    "subsections": [
      {
        "id": "use-case-premium-customer-segmentation",
        "title": "Use Case: Premium Customer Segmentation",
        "content": "**Goal:** Identify premium customers (LTV > $1000) and provide personalized checkout experience in Shopify.\n\n**Implementation:**\n\n**1. Xano: Calculate LTV and store in Extras**\n```javascript\n// Xano function: Login endpoint\nconst user = authenticateUser(email, password);\nconst ltv = calculateLifetimeValue(user.id);\nconst segment = ltv > 1000 ? \"premium\" : \"standard\";\n\nconst extras = {\n  lifetime_value: ltv,\n  segment: segment,\n  user_role: \"customer\",\n  shopify_customer_id: user.shopify_id\n};\n\nconst authToken = createAuthenticationToken(user.id, extras);\nreturn { authToken };\n```\n\n**2. Xano: Generate OIDC ID Token with Extras**\n```javascript\n// Xano function: Token endpoint\nconst idToken = createJWT({\n  sub: user.id,\n  email: user.email,\n  lifetime_value: extras.lifetime_value,\n  segment: extras.segment\n});\n\nreturn { id_token: idToken };\n```\n\n**3. Shopify: Receive ID Token and extract Extras**\n- Shopify validates ID Token\n- Extracts `segment` and `lifetime_value` claims\n- Creates customer session with custom attributes\n\n**4. Xano: Sync Extras to Shopify Metaobjects**\n```javascript\n// Xano webhook: Post-authentication sync\nconst mutation = `\n  mutation UpdateCustomer($input: CustomerInput!) {\n    customerUpdate(input: $input) {\n      customer {\n        id\n        metafields(first: 5) {\n          edges { node { key value } }\n        }\n      }\n    }\n  }\n`;\n\nexecuteShopifyGraphQL(mutation, {\n  input: {\n    id: extras.shopify_customer_id,\n    metafields: [\n      { namespace: \"custom\", key: \"segment\", value: extras.segment },\n      { namespace: \"custom\", key: \"ltv\", value: extras.lifetime_value.toString() }\n    ]\n  }\n});\n```\n\n**5. Shopify: Use Metaobjects in checkout**\n```liquid\n{% if customer.metafields.custom.segment == \"premium\" %}\n  <div class=\"premium-banner\">\n    \ud83c\udf1f Welcome back, Premium Customer! Enjoy free shipping on this order.\n  </div>\n{% endif %}\n```"
      }
    ]
  },
  {
    "id": "summary-integration-architecture",
    "title": "Summary: Integration Architecture",
    "content": "| Component | Role | Data Flow |\n|:----------|:-----|:----------|\n| **Xano Extras** | Store custom claims in encrypted JWE token | User login \u2192 Xano generates token with Extras |\n| **OIDC ID Token** | Transport user identity + custom claims to Shopify | Xano \u2192 Shopify (ID Token with Extras as claims) |\n| **Shopify Metaobjects** | Persist custom claims for use in commerce flows | Xano webhook \u2192 Shopify GraphQL \u2192 Metaobjects updated |\n| **Webflow Collections** | Central ledger for user state and consent | Xano webhook \u2192 Webflow API \u2192 Collections updated |\n| **UCP Session** | Enable retargeting and agentic commerce | Xano \u2192 Google UCP API \u2192 Session/Customer ID synced |",
    "subsections": []
  },
  {
    "id": "key-takeaways",
    "title": "Key Takeaways",
    "content": "1. **Xano Extras are custom claims** embedded in JWE tokens, providing encrypted, tamper-proof user metadata.\n\n2. **Shopify OIDC accepts custom claims** in ID tokens, allowing Xano Extras to be transmitted during federated login.\n\n3. **Xano acts as middleware** orchestrating authentication, claim generation, and data synchronization across Webflow, Shopify, and UCP.\n\n4. **Shopify Metaobjects persist Extras** for use in checkout, customer accounts, and marketing personalization.\n\n5. **Security is maintained** through JWE encryption, token validation, and idempotency checks.\n\n6. **Real-time sync** enables dynamic user segmentation, consent management, and personalized commerce experiences.",
    "subsections": []
  },
  {
    "id": "references",
    "title": "References",
    "content": "[1] [User Auth & Data - Xano Documentation](https://docs.xano.com/building-backend-features/user-authentication-and-user-data)\n\n[2] [Connecting your own identity provider to customer accounts - Shopify Help Center](https://help.shopify.com/en/manual/customers/customer-accounts/new-customer-accounts/identity-provider)\n\n[3] [Connect Xano Backend to Shopify - Xano Actions](https://www.xano.com/connect/shopify/)\n\n[4] [Understanding JSON Web Encryption (JWE) - Scott Brady](https://www.scottbrady.io/jose/json-web-encryption)\n\n[5] Related knowledge: Idempotency Function Checks for Session and Keyed Data",
    "subsections": []
  }
];
