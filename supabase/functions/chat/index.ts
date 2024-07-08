import "jsr:/@kitsonk/xhr"
import "https://esm.sh/v135/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts"
import { OpenAI } from "https://esm.sh/openai@4.52.3"
import { createClient } from '@supabase/supabase-js';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { codeBlock } from 'common-tags';
// import OpenAI from 'openai';
import { Database } from '../_lib/database.ts';

// import { usePipeline } from '../../../lib/hooks/use-pipeline.ts';

// const openaiBaseUrl = Deno.env.get('OPENAI_BASE_URL');
// const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
// console.log("openaiBaseUrl", openaiBaseUrl);
// console.log("openaiApiKey", openaiApiKey);

const openaiBaseUrl = "http://10.128.138.175:11434/v1";
// const openaiBaseUrl = "http://10.128.138.175:8000/v1";
// const openaiBaseUrl = "http://host.docker.internal:11434/v1/";
const openaiApiKey = "ollama-ai";

const openai = new OpenAI({
  baseURL: openaiBaseUrl,
  apiKey: openaiApiKey,
});

// const generateEmbedding = usePipeline(
//   'feature-extraction',
//   'Supabase/gte-small'
// );

// These are automatically injected
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
console.log("supabaseUrl", supabaseUrl);
console.log("supabaseAnonKey", supabaseAnonKey);

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', // Add more methods if needed
};

Deno.serve(async (req) => {
  // Handle CORS

  console.log("req", req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response(
      JSON.stringify({
        error: 'Missing environment variables.',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  const authorization = req.headers.get('Authorization');

  if (!authorization) {
    return new Response(
      JSON.stringify({ error: `No authorization header passed` }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: authorization }
    },
    auth: {
      persistSession: false,
    },
  });

  const { messages, embedding } = await req.json();

  console.log("messages", messages);
  console.log("embedding", embedding);

  const { data: documents, error: matchError } = await supabase
    .rpc('match_document_sections', {
      embedding,
      match_threshold: 0.0,
    })
    .select('content')
    .limit(5);

  

  if (matchError) {
    console.error(matchError);

    return new Response(
      JSON.stringify({
        error: 'There was an error reading your documents, please try again.',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  const injectedDocs =
    documents && documents.length > 0
      ? documents.map(({ content }) => content).join('\n\n')
      : 'No documents found';

  console.log("injectedDocs", injectedDocs);

  const completionMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
    [
      {
        role: 'user',
        content: codeBlock`
        You're an AI assistant who answers questions about documents.

        You're a chat bot, so keep your replies succinct.

        You're only allowed to use the documents below to answer the question.

        If the question isn't related to these documents, say:
        "Sorry, I couldn't find any information on that."

        If the information isn't available in the below documents, say:
        "Sorry, I couldn't find any information on that."

        Do not go off topic.

        Documents:
        ${injectedDocs}
      `,
      },
      ...messages,
    ];
  console.log("completionMessages", completionMessages);

  const completionStream = await openai.chat.completions.create({
    model: 'llama3:latest',
    messages: completionMessages,
    max_tokens: 1024,
    temperature: 0.8,
    stream: true,
  });

  console.log("completionStream", completionStream);



  const stream = OpenAIStream(completionStream);
  return new StreamingTextResponse(stream, { headers: corsHeaders });
});
