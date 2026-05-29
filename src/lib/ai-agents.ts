import { generateObject, generateText } from "ai";
import { google } from "@ai-sdk/google";
import { env } from "./env";
import { z } from "zod";
import { REST_METHOD } from "@prisma/client";
import { JsonBodyGenerationParams, RequestSuggestionParams } from "@/types/ai";

const model = google("gemini-3.1-flash-lite");

const RequestNameSchema = z.object({
  suggestions: z
    .array(
      z.object({
        name: z.string().describe("Suggested request name"),
        reasoning: z.string().describe("Reasoning for the suggested name"),
        confidence: z
          .number()
          .min(0)
          .max(1)
          .describe("Confidence in the suggestion"),
      }),
    )
    .length(3)
    .describe("3 suggested request names"),
});

// Request Name Suggestion Agent
export async function suggestRequestName(params: RequestSuggestionParams) {
  try {
    const prompt = `
You are an AI assistant helping developers name their API requests in a workspace called "${params.workspaceName}".

Context:
- HTTP Method: ${params.method}
- Workspace: ${params.workspaceName}
- URL: ${params.url || "Not provided"}
- Description: ${params.description || "Not provided"}

Generate 3 concise, descriptive request names that:
1. Reflect the HTTP method and purpose
2. Are relevant to the workspace context
3. Follow common REST API naming conventions
4. Are professional and clear
5. Are between 2-6 words long

Consider the workspace theme and make names that would make sense to other developers.
`;

    const response = await generateObject({
      model,
      schema: RequestNameSchema,
      prompt,
      temperature: 0.7,
    });

    return {
      success: true,
      data: response.object,
      error: null,
    };
  } catch (error) {
    console.error("error generating request name", error);
    return {
      success: false,
      data: null,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

/**
 * Batch process multiple requests for name suggestions
 */
export async function batchSuggestRequestNames(
  requests: RequestSuggestionParams[],
): Promise<
  Array<{
    originalRequest: RequestSuggestionParams;
    suggestions: z.infer<typeof RequestNameSchema> | null;
    error: string | null;
  }>
> {
  const results = await Promise.allSettled(
    requests.map((request) => suggestRequestName(request)),
  );

  return results.map((result, index) => ({
    originalRequest: requests[index],
    suggestions:
      result.status === "fulfilled" && result.value.success
        ? result.value.data
        : null,
    error:
      result.status === "fulfilled"
        ? result.value.error
        : result.reason?.message || "Unknown error",
  }));
}

const JsonBodyGenerationSchema = z.object({
  jsonBody: z.string().describe("Generated JSON body"),
  explaination: z.string().describe(" explanation for the generated JSON body"),
  suggestions: z.array(z.string()).describe("3 suggested JSON bodies"),
});

// Json Body Generation Agent
export async function generateJsonBody(params: JsonBodyGenerationParams) {
  try {
    const systemPrompt = `
        You are an AI assistant that generates JSON request bodies for API calls.
        
        Context:
        - HTTP Method: ${params.method}
        - Endpoint: ${params.endpoint || "Not specified"}
        - Additional Context: ${params.context || "None"}
        
        Guidelines:
        1. Generate realistic, well-structured JSON based on the user's request
        2. Use appropriate data types (strings, numbers, booleans, arrays, objects)
        3. Include reasonable example values that make sense for the context
        4. Follow common JSON and REST API conventions
        5. Consider the HTTP method when structuring the data
        6. Make the JSON practical and ready-to-use
        7. Include nested objects and arrays when appropriate
        8. Use meaningful field names
        9. Return the JSON as a properly formatted JSON string
        
        User Request: ${params.prompt}
        
        IMPORTANT: Return the jsonBody as a valid JSON string that can be parsed with JSON.parse().
        `;

    const response = await generateObject({
      model,
      schema: JsonBodyGenerationSchema,
      prompt: systemPrompt,
      temperature: 0.3,
    });

    let parsedJsonBody;
    try {
      parsedJsonBody = JSON.parse(response.object.jsonBody);
    } catch (error) {
      parsedJsonBody = response.object.jsonBody;
    }

    return {
      success: true,
      data: {
        ...response.object,
        jsonBody: parsedJsonBody,
      },
      error: null,
    };
  } catch (error) {
    console.error("error generating JSON body", error);
    return {
      success: false,
      data: null,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}
