import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TokenRequest {
  action: 'get_token'
}

interface PhotoRequest {
  action: 'get_photo'
  userEmail: string
  accessToken: string
}

type RequestBody = TokenRequest | PhotoRequest

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, ...params } = await req.json() as RequestBody

    if (action === 'get_token') {
      return await getAccessToken()
    } else if (action === 'get_photo') {
      const { userEmail, accessToken } = params as PhotoRequest
      return await getUserPhoto(userEmail, accessToken)
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
  } catch (error) {
    console.error('Error in microsoft-graph-proxy:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function getAccessToken() {
  const TENANT_ID = '24f0ac3b-8192-4968-ae6f-47a2a4e8ce09'
  const CLIENT_ID = '3198d965-afc4-4771-9d15-65ae0aa6433c'
  const CLIENT_SECRET = Deno.env.get("AZURE_CLIENT_SECRET") || "" 
  
  const tokenUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`
  
  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials'
  })

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString()
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Failed to get token:', response.status, response.statusText, errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to get access token', details: errorText }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const tokenData = await response.json()
    
    return new Response(
      JSON.stringify({ access_token: tokenData.access_token }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error getting access token:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to get access token' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function getUserPhoto(userEmail: string, accessToken: string) {
  const photoUrl = `https://graph.microsoft.com/v1.0/users/${userEmail}/photo/$value`
  
  try {
    const response = await fetch(photoUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'image/jpeg'
      }
    })

    if (!response.ok) {
      if (response.status === 404) {
        return new Response(
          JSON.stringify({ error: 'Photo not found' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      
      const errorText = await response.text()
      console.error('Failed to get photo:', response.status, response.statusText, errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to get photo', details: errorText }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const photoBlob = await response.blob()
    const photoBuffer = await photoBlob.arrayBuffer()
    const photoBase64 = btoa(String.fromCharCode(...new Uint8Array(photoBuffer)))
    
    return new Response(
      JSON.stringify({ 
        photo: `data:image/jpeg;base64,${photoBase64}`,
        contentType: response.headers.get('content-type') || 'image/jpeg'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error getting user photo:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to get user photo' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}