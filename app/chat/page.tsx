'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePipeline } from '@/lib/hooks/use-pipeline';
import { cn } from '@/lib/utils';
import { Database } from '@/supabase/functions/_lib/database';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useChat } from 'ai/react';
import { pipeline } from '@xenova/transformers';
import { OpenAI } from "openai";


export default function ChatPage() {
  const supabase = createClientComponentClient<Database>();

  // const generateEmbedding = await pipeline(
  //   'feature-extraction',
  //   'Supabase/gte-small'
  // );

  const openaiBaseUrl = "http://10.128.138.175:11434/v1";
  const openaiApiKey = "ollama-ai";

  const openai = new OpenAI({
    baseURL: openaiBaseUrl,
    apiKey: openaiApiKey,
  });


  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/chat`,
    });

  console.log("messages", messages);
  console.log("input", input);

  const generateEmbedding = true;
  const isReady = !!generateEmbedding;

  return (
    <div className="max-w-6xl flex flex-col items-center w-full h-full">
      <div className="flex flex-col w-full gap-6 grow my-2 sm:my-10 p-4 sm:p-8 sm:border rounded-sm overflow-y-auto">
        <div className="border-slate-400 rounded-lg flex flex-col justify-start gap-4 pr-2 grow overflow-y-scroll">
          {messages.map(({ id, role, content }) => (
            <div
              key={id}
              className={cn(
                'rounded-xl bg-gray-500 text-white px-4 py-2 max-w-lg',
                role === 'user' ? 'self-end bg-blue-600' : 'self-start'
              )}
            >
              {content}
            </div>
          ))}
          {isLoading && (
            <div className="self-start m-6 text-gray-500 before:text-gray-500 after:text-gray-500 dot-pulse" />
          )}
          {messages.length === 0 && (
            <div className="self-stretch flex grow items-center justify-center">
              <svg
                className="opacity-10"
                width="150px"
                height="150px"
                version="1.1"
                viewBox="0 0 100 100"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g>
                  <path d="m77.082 39.582h-29.164c-3.543 0-6.25 2.707-6.25 6.25v16.668c0 3.332 2.707 6.25 6.25 6.25h20.832l8.332 8.332v-8.332c3.543 0 6.25-2.918 6.25-6.25v-16.668c0-3.5391-2.707-6.25-6.25-6.25z" />
                  <path d="m52.082 25h-29.164c-3.543 0-6.25 2.707-6.25 6.25v16.668c0 3.332 2.707 6.25 6.25 6.25v8.332l8.332-8.332h6.25v-8.332c0-5.832 4.582-10.418 10.418-10.418h10.418v-4.168c-0.003907-3.543-2.7109-6.25-6.2539-6.25z" />
                </g>
              </svg>
            </div>
          )}
        </div>
        <form
          className="flex items-center space-x-2 gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!generateEmbedding) {
              throw new Error('Unable to generate embeddings');
            }

            // const output = await generateEmbedding(input, {
            //   pooling: 'mean',
            //   normalize: true,
            // });
            const embeddingResponse = await openai.embeddings.create({
              model: "gpt-4-0125-preview:latest",
              input: [input],
            });
          
            const embeddingStringNumber  = embeddingResponse.data[0].embedding;
            const embedding = JSON.stringify(embeddingStringNumber);
            // console.log("embedding", embedding);

            // const embedding = JSON.stringify(Array.from(output.data));

            const {
              data: { session },
            } = await supabase.auth.getSession();

            if (!session) {
              return;
            }

            handleSubmit(e, {
              options: {
                headers: {
                  authorization: `Bearer ${session.access_token}`,
                },
                body: {
                  embedding,
                },
              },
            });
          }}
        >
          <Input
            type="text"
            autoFocus
            placeholder="Send a message"
            value={input}
            onChange={handleInputChange}
          />
          <Button type="submit" disabled={!isReady}>
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}



// 'use client';

// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { usePipeline } from '@/lib/hooks/use-pipeline';
// import { cn } from '@/lib/utils';
// import { Database } from '@/supabase/functions/_lib/database';
// import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
// import { useChat } from 'ai/react';
// // import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
// // import { env, pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.5.0'

//   // Configuration for Deno runtime
//   // env.useBrowserCache = false;
//   // env.allowLocalModels = false;

//   // const generateEmbedding = await pipeline(
//   //   'feature-extraction',
//   //   'Supabase/gte-small',
//   // );

// export default function ChatPage() {
//   const supabase = createClientComponentClient<Database>();

//   const generateEmbedding = usePipeline(
//     'feature-extraction',
//     'Supabase/gte-small'
//   );
  
//   const { messages, input, handleInputChange, handleSubmit, isLoading } =
//     useChat({
//       api: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/chat`,
//     });

//   console.log("messages", messages);
//   console.log("input", input);

//   const isReady = !!generateEmbedding;

//   return (
//     <div className="max-w-6xl flex flex-col items-center w-full h-full">
//       <div className="flex flex-col w-full gap-6 grow my-2 sm:my-10 p-4 sm:p-8 sm:border rounded-sm overflow-y-auto">
//         <div className="border-slate-400 rounded-lg flex flex-col justify-start gap-4 pr-2 grow overflow-y-scroll">
//           {messages.map(({ id, role, content }) => (
//             <div
//               key={id}
//               className={cn(
//                 'rounded-xl bg-gray-500 text-white px-4 py-2 max-w-lg',
//                 role === 'user' ? 'self-end bg-blue-600' : 'self-start'
//               )}
//             >
//               {content}
//             </div>
//           ))}
//           {isLoading && (
//             <div className="self-start m-6 text-gray-500 before:text-gray-500 after:text-gray-500 dot-pulse" />
//           )}
//           {messages.length === 0 && (
//             <div className="self-stretch flex grow items-center justify-center">
//               <svg
//                 className="opacity-10"
//                 width="150px"
//                 height="150px"
//                 version="1.1"
//                 viewBox="0 0 100 100"
//                 xmlns="http://www.w3.org/2000/svg"
//               >
//                 <g>
//                   <path d="m77.082 39.582h-29.164c-3.543 0-6.25 2.707-6.25 6.25v16.668c0 3.332 2.707 6.25 6.25 6.25h20.832l8.332 8.332v-8.332c3.543 0 6.25-2.918 6.25-6.25v-16.668c0-3.5391-2.707-6.25-6.25-6.25z" />
//                   <path d="m52.082 25h-29.164c-3.543 0-6.25 2.707-6.25 6.25v16.668c0 3.332 2.707 6.25 6.25 6.25v8.332l8.332-8.332h6.25v-8.332c0-5.832 4.582-10.418 10.418-10.418h10.418v-4.168c-0.003907-3.543-2.7109-6.25-6.2539-6.25z" />
//                 </g>
//               </svg>
//             </div>
//           )}
//         </div>
//         <form
//           className="flex items-center space-x-2 gap-2"
//           onSubmit={async (e) => {
//             e.preventDefault();
//             if (!generateEmbedding) {
//               throw new Error('Unable to generate embeddings');
//             }

//             const output = await generateEmbedding(input, {
//               pooling: 'mean',
//               normalize: true,
//             });

//             const embedding = JSON.stringify(Array.from(output.data));

//             const {
//               data: { session },
//             } = await supabase.auth.getSession();

//             if (!session) {
//               return;
//             }

//             handleSubmit(e, {
//               options: {
//                 headers: {
//                   authorization: `Bearer ${session.access_token}`,
//                 },
//                 body: {
//                   embedding,
//                 },
//               },
//             });
//           }}
//         >
//           <Input
//             type="text"
//             autoFocus
//             placeholder="Send a message"
//             value={input}
//             onChange={handleInputChange}
//           />
//           <Button type="submit" disabled={!isReady}>
//             Send
//           </Button>
//         </form>
//       </div>
//     </div>
//   );
// }






























// // 'use client';

// // import { Button } from '@/components/ui/button';
// // import { Input } from '@/components/ui/input';
// // import { usePipeline } from '@/lib/hooks/use-pipeline';
// // import { cn } from '@/lib/utils';
// // import { Database } from '@/supabase/functions/_lib/database';
// // import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
// // // import { createClient } from '@supabase/supabase-js'
// // import { useChat } from 'ai/react';
// // // import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';


// // export default function ChatPage() {
// //   const supabase = createClientComponentClient<Database>();
// //   // const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
// //   const corsHeaders = {
// //     'Access-Control-Allow-Credentials': 'true',
// //     'Access-Control-Allow-Origin': '*',
// //     'Access-Control-Allow-Methods': 'GET,DELETE,PATCH,POST,PUT, OPTIONS',
// //     'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
// //   };

// //   const generateEmbedding = usePipeline(
// //     'feature-extraction',
// //     'Supabase/gte-small'
// //   );

// //   const { messages, input, handleInputChange, handleSubmit, isLoading } =
// //       useChat({
// //         api: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/chat`,
// //         headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}` } as Record<string, string>,
// //       });

// //   // console.log("messages", messages);
// //   // console.log("input", input);
// //   // console.log("handleInputChange", handleInputChange);
// //   // console.log("handleSubmit", handleSubmit);

// //   const isReady = !!generateEmbedding;
// //   console.log("isReady", isReady);
// //   console.log("messages", messages);
// //   console.log("input", input);
// //   console.log("handleInputChange", handleInputChange);
// //   console.log("handleSubmit", handleSubmit);

// //   return (
// //     <div className="max-w-6xl flex flex-col items-center w-full h-full">
// //       <div className="flex flex-col w-full gap-6 grow my-2 sm:my-10 p-4 sm:p-8 sm:border rounded-sm overflow-y-auto">
// //         <div className="border-slate-400 rounded-lg flex flex-col justify-start gap-4 pr-2 grow overflow-y-scroll">
// //           {messages.map(({ id, role, content }) => (
// //             <div
// //               key={id}
// //               className={cn(
// //                 'rounded-xl bg-gray-500 text-white px-4 py-2 max-w-lg',
// //                 role === 'user' ? 'self-end bg-blue-600' : 'self-start'
// //               )}
// //             >
// //               {content}
// //             </div>
// //           ))}
// //           {isLoading && (
// //             <div className="self-start m-6 text-gray-500 before:text-gray-500 after:text-gray-500 dot-pulse" />
// //           )}
// //           {messages.length === 0 && (
// //             <div className="self-stretch flex grow items-center justify-center">
// //               <svg
// //                 className="opacity-10"
// //                 width="150px"
// //                 height="150px"
// //                 version="1.1"
// //                 viewBox="0 0 100 100"
// //                 xmlns="http://www.w3.org/2000/svg"
// //               >
// //                 <g>
// //                   <path d="m77.082 39.582h-29.164c-3.543 0-6.25 2.707-6.25 6.25v16.668c0 3.332 2.707 6.25 6.25 6.25h20.832l8.332 8.332v-8.332c3.543 0 6.25-2.918 6.25-6.25v-16.668c0-3.5391-2.707-6.25-6.25-6.25z" />
// //                   <path d="m52.082 25h-29.164c-3.543 0-6.25 2.707-6.25 6.25v16.668c0 3.332 2.707 6.25 6.25 6.25v8.332l8.332-8.332h6.25v-8.332c0-5.832 4.582-10.418 10.418-10.418h10.418v-4.168c-0.003907-3.543-2.7109-6.25-6.2539-6.25z" />
// //                 </g>
// //               </svg>
// //             </div>
// //           )}
// //         </div>
// //         <form
// //           className="flex items-center space-x-2 gap-2"
// //           onSubmit={async (e) => {
// //             e.preventDefault();
// //             if (!generateEmbedding) {
// //               throw new Error('Unable to generate embeddings');
// //             }

// //             console.log("input check: ", input);

// //             const output = await generateEmbedding(input, {
// //               pooling: 'mean',
// //               normalize: true,
// //             });

// //             const embedding = JSON.stringify(Array.from(output.data));
// //             console.log("embedding", embedding);

// //             const {
// //               data: { session },
// //             } = await supabase.auth.getSession();

// //             if (!session) {
// //               return;
// //             }

// //             console.log("session", session);  

// //             handleSubmit(e, {
// //               options: {
// //                 headers: {
// //                   ...corsHeaders, // Spread the CORS headers
// //                   'Content-Type': 'application/json',
// //                   authorization: `Bearer ${session.access_token}`,
// //                 },
// //                 body: {embedding},
// //               },
// //             });
// //           }}
// //         >
// //           <Input
// //             type="text"
// //             autoFocus
// //             placeholder="Send a message"
// //             value={input}
// //             onChange={handleInputChange}
// //           />
// //           <Button type="submit" disabled={!isReady}>
// //             Send
// //           </Button>
// //         </form>
// //       </div>
// //     </div>
// //   );
// // }
