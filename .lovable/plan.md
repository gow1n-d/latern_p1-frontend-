

## Plan: Switch Edge Functions to OpenRouter API

### Problem
The Google Gemini API key is hitting rate limits (429). You've provided an OpenRouter API key (`sk-or-v1-...`) which provides access to many models with separate quota.

### Approach
Update all 5 edge functions to use the **OpenRouter API** as the primary provider, with the existing Lovable AI Gateway as fallback. OpenRouter uses an OpenAI-compatible API format, which simplifies the code (no more Gemini SSE-to-OpenAI transform needed).

### Steps

1. **Store the OpenRouter key** as a secret named `OPENROUTER_API_KEY`

2. **Update all 5 edge functions** to call OpenRouter first:
   - `generate-section/index.ts`
   - `ai-assist/index.ts`
   - `humanize-text/index.ts`
   - `check-plagiarism/index.ts`
   - `scholar-search/index.ts`

3. **For streaming functions** (generate-section, ai-assist, humanize-text):
   - Call `https://openrouter.ai/api/v1/chat/completions` with `stream: true`
   - OpenRouter returns OpenAI-compatible SSE natively, so the TransformStream code can be removed — just pass through the response body directly
   - Fallback to Lovable AI Gateway on 429/402

4. **For non-streaming functions** (check-plagiarism, scholar-search):
   - Call OpenRouter with `stream: false`
   - Parse the standard `choices[0].message.content` response
   - Fallback to Lovable AI Gateway on 429/402

5. **Model selection**: Use `google/gemini-2.0-flash` via OpenRouter (or `openai/gpt-4o-mini` as alternative) for cost efficiency

### Technical Details

OpenRouter request format:
```typescript
const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "google/gemini-2.0-flash-001",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    stream: true,
    temperature: 0.2
  })
});
```

Since OpenRouter is OpenAI-compatible, the frontend `parseSSEStream` in `src/lib/ai.ts` requires **no changes**.

