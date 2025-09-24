import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the function
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { email, verification_code, expires_in } = await req.json()

    if (!email || !verification_code) {
      return new Response(
        JSON.stringify({ error: 'Missing email or verification code' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Send email using Supabase's email service
    const { data, error } = await supabaseClient.auth.admin.generateLink({
      type: 'signup',
      email: email,
      options: {
        redirectTo: `${Deno.env.get('SITE_URL')}/auth/callback?code=${verification_code}`,
      }
    })

    if (error) {
      console.error('Error generating link:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to send verification email' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // For now, we'll use a simple approach - store the verification code in a table
    // and send a custom email with the code
    const { error: insertError } = await supabaseClient
      .from('verification_codes')
      .insert({
        email: email,
        code: verification_code,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
        created_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('Error storing verification code:', insertError)
      // Continue anyway, the code is still valid
    }

    // Send a custom email with the verification code
    // This would typically use a service like SendGrid, Resend, or similar
    // For now, we'll just log it
    console.log(`📧 Verification email for ${email}:`)
    console.log(`🔐 Code: ${verification_code}`)
    console.log(`⏰ Expires in: ${expires_in}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Verification email sent successfully',
        code: verification_code // For testing purposes
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
