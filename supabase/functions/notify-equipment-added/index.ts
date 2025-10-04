import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EquipmentNotification {
  equipmentId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { equipmentId }: EquipmentNotification = await req.json();

    console.log('Notifying n8n webhook for equipment:', equipmentId);

    // Call n8n webhook
    const webhookUrl = 'https://worldeedit.app.n8n.cloud/webhook/webhook-nouveau-equipment';
    
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        equipmentId: equipmentId,
        timestamp: new Date().toISOString(),
        source: 'lovable-inventory'
      }),
    });

    if (!webhookResponse.ok) {
      console.error('n8n webhook error:', webhookResponse.status, await webhookResponse.text());
      throw new Error(`Webhook call failed with status: ${webhookResponse.status}`);
    }

    console.log('n8n webhook notified successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notification envoyée avec succès' 
      }), 
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in notify-equipment-added function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
