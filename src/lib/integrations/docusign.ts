// DocuSign Integration Service
import { IntegrationConfig } from '@/types/integrations'

const DS_AUTH_URL = 'https://account-d.docusign.com/oauth/auth' // Use account.docusign.com for production
const DS_TOKEN_URL = 'https://account-d.docusign.com/oauth/token'
const DS_API_BASE = 'https://demo.docusign.net/restapi/v2.1' // Use docusign.net for production

export interface DocuSignConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  environment: 'demo' | 'production'
}

function getBaseUrls(environment: 'demo' | 'production') {
  if (environment === 'production') {
    return {
      auth: 'https://account.docusign.com/oauth/auth',
      token: 'https://account.docusign.com/oauth/token',
      api: 'https://docusign.net/restapi/v2.1',
    }
  }
  return {
    auth: DS_AUTH_URL,
    token: DS_TOKEN_URL,
    api: DS_API_BASE,
  }
}

export function getAuthorizationUrl(config: DocuSignConfig, state: string): string {
  const urls = getBaseUrls(config.environment)
  const params = new URLSearchParams({
    response_type: 'code',
    scope: 'signature extended',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    state,
  })
  return `${urls.auth}?${params.toString()}`
}

export async function exchangeCodeForTokens(
  config: DocuSignConfig,
  code: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const urls = getBaseUrls(config.environment)
  const response = await fetch(urls.token, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
    }),
  })

  if (!response.ok) {
    throw new Error(`DocuSign token exchange failed: ${response.statusText}`)
  }

  return response.json()
}

export async function getUserInfo(accessToken: string): Promise<{ accountId: string; baseUri: string }> {
  const response = await fetch('https://account-d.docusign.com/oauth/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`DocuSign userinfo failed: ${response.statusText}`)
  }

  const data = await response.json()
  const account = data.accounts.find((a: any) => a.is_default) || data.accounts[0]
  return {
    accountId: account.account_id,
    baseUri: account.base_uri,
  }
}

export interface ExtensionRequestParams {
  accountId: string
  baseUri: string
  accessToken: string
  signerEmail: string
  signerName: string
  clientName: string
  formNumber: string
  originalDueDate: string
  extensionDueDate: string
  reason?: string
}

export async function createExtensionEnvelope(params: ExtensionRequestParams): Promise<string> {
  const {
    accountId,
    baseUri,
    accessToken,
    signerEmail,
    signerName,
    clientName,
    formNumber,
    originalDueDate,
    extensionDueDate,
    reason,
  } = params

  // Create a simple extension request document
  const documentContent = `
    <html>
      <body style="font-family: Arial, sans-serif; padding: 40px;">
        <h1>Tax Filing Extension Request</h1>
        <p><strong>Client:</strong> ${clientName}</p>
        <p><strong>Form:</strong> ${formNumber}</p>
        <p><strong>Original Due Date:</strong> ${originalDueDate}</p>
        <p><strong>Extended Due Date:</strong> ${extensionDueDate}</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        <br/>
        <p>I hereby request an extension for the above tax filing.</p>
        <br/>
        <p><strong>Signature:</strong> /sig1/</p>
        <p><strong>Date:</strong> /date1/</p>
      </body>
    </html>
  `

  const envelopeDefinition = {
    emailSubject: `Extension Request - ${clientName} - ${formNumber}`,
    documents: [
      {
        documentBase64: Buffer.from(documentContent).toString('base64'),
        name: `Extension_Request_${formNumber}.html`,
        fileExtension: 'html',
        documentId: '1',
      },
    ],
    recipients: {
      signers: [
        {
          email: signerEmail,
          name: signerName,
          recipientId: '1',
          routingOrder: '1',
          tabs: {
            signHereTabs: [
              {
                anchorString: '/sig1/',
                anchorUnits: 'pixels',
                anchorXOffset: '0',
                anchorYOffset: '-10',
              },
            ],
            dateSignedTabs: [
              {
                anchorString: '/date1/',
                anchorUnits: 'pixels',
                anchorXOffset: '0',
                anchorYOffset: '-10',
              },
            ],
          },
        },
      ],
    },
    status: 'sent',
  }

  const response = await fetch(`${baseUri}/restapi/v2.1/accounts/${accountId}/envelopes`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(envelopeDefinition),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`DocuSign create envelope failed: ${error.message || response.statusText}`)
  }

  const result = await response.json()
  return result.envelopeId
}

export async function getEnvelopeStatus(
  accessToken: string,
  baseUri: string,
  accountId: string,
  envelopeId: string
): Promise<{ status: string; completedDateTime?: string }> {
  const response = await fetch(
    `${baseUri}/restapi/v2.1/accounts/${accountId}/envelopes/${envelopeId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error(`DocuSign get envelope failed: ${response.statusText}`)
  }

  const data = await response.json()
  return {
    status: data.status,
    completedDateTime: data.completedDateTime,
  }
}

export async function listTemplates(
  accessToken: string,
  baseUri: string,
  accountId: string
): Promise<Array<{ templateId: string; name: string }>> {
  const response = await fetch(
    `${baseUri}/restapi/v2.1/accounts/${accountId}/templates`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error(`DocuSign list templates failed: ${response.statusText}`)
  }

  const data = await response.json()
  return (data.envelopeTemplates || []).map((t: any) => ({
    templateId: t.templateId,
    name: t.name,
  }))
}
