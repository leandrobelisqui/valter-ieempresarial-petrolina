// Supabase Edge Function: qwifi-webhook
// Recebe webhooks da QWiFi e envia para CleanSense

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface QWiFiWebhookPayload {
  event_type: string;
  data: {
    customer?: {
      name?: string;
      email?: string;
      phone?: string;
      whatsapp?: string;
    };
    product?: {
      name?: string;
      price?: number;
    };
    order?: {
      id?: string;
      status?: string;
      amount?: number;
    };
    utm?: {
      source?: string;
      medium?: string;
      campaign?: string;
      content?: string;
    };
    [key: string]: any;
  };
}

interface CleanSenseContact {
  name: string;
  email?: string;
  phone?: string;
  tags?: string[];
  custom_fields?: Record<string, any>;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
}

serve(async (req: Request) => {
  // CORS headers
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  // Only accept POST
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const payload: QWiFiWebhookPayload = await req.json();
    console.log("QWiFi webhook received:", JSON.stringify(payload));

    // Environment variables
    const CLEAN_SENSE_API_KEY = Deno.env.get("CLEAN_SENSE_API_KEY");
    const CLEAN_SENSE_BASE_URL = Deno.env.get("CLEAN_SENSE_BASE_URL") || "https://app.clinisense.online/api";
    const TAG_ABANDONO = Deno.env.get("CLEAN_SENSE_TAG_ABANDONO"); // ID da etiqueta "abandono de carrinho"
    const TAG_COMPRA = Deno.env.get("CLEAN_SENSE_TAG_COMPRA"); // ID da etiqueta "compra aprovada"

    if (!CLEAN_SENSE_API_KEY) {
      throw new Error("CLEAN_SENSE_API_KEY not configured");
    }

    // Determine event type and tag
    const eventType = payload.event_type?.toLowerCase() || "";
    let tagId: string | undefined;
    let eventName: string;

    if (eventType.includes("abandoned") || eventType.includes("abandono") || eventType === "cart_abandoned") {
      tagId = TAG_ABANDONO;
      eventName = "abandono_carrinho";
    } else if (eventType.includes("approved") || eventType.includes("aprovada") || eventType === "purchase" || eventType === "order_approved") {
      tagId = TAG_COMPRA;
      eventName = "compra_aprovada";
    } else {
      console.log("Unknown event type:", eventType);
      return new Response(
        JSON.stringify({ message: "Event type not handled", event_type: eventType }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Extract customer data from QWiFi payload
    // Note: Adjust these field names based on actual QWiFi webhook structure
    const customer = payload.data?.customer || {};
    const order = payload.data?.order || {};
    const product = payload.data?.product || {};
    const utm = payload.data?.utm || {};

    // Prepare contact data for CleanSense
    const contact: CleanSenseContact = {
      name: customer.name || "Cliente QWiFi",
      email: customer.email,
      phone: customer.phone || customer.whatsapp,
      tags: tagId ? [tagId] : [],
      custom_fields: {
        qwifi_order_id: order.id,
        qwifi_product: product.name,
        qwifi_amount: order.amount,
        qwifi_event: eventName,
        source: "IE Empresarial Petrolina",
      },
      utm_source: utm.source,
      utm_medium: utm.medium,
      utm_campaign: utm.campaign,
      utm_content: utm.content,
    };

    // Remove undefined fields
    Object.keys(contact).forEach((key) => {
      if (contact[key as keyof CleanSenseContact] === undefined) {
        delete contact[key as keyof CleanSenseContact];
      }
    });

    // Send to CleanSense
    console.log("Sending to CleanSense:", JSON.stringify(contact));

    const cleanSenseResponse = await fetch(`${CLEAN_SENSE_BASE_URL}/contacts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${CLEAN_SENSE_API_KEY}`,
      },
      body: JSON.stringify(contact),
    });

    if (!cleanSenseResponse.ok) {
      const errorText = await cleanSenseResponse.text();
      throw new Error(`CleanSense API error: ${cleanSenseResponse.status} - ${errorText}`);
    }

    const cleanSenseData = await cleanSenseResponse.json();
    console.log("CleanSense response:", JSON.stringify(cleanSenseData));

    return new Response(
      JSON.stringify({
        success: true,
        event: eventName,
        tag_applied: tagId,
        clean_sense_contact_id: cleanSenseData.id || cleanSenseData.contact_id,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );

  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
