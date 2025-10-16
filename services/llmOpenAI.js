
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function chat(prompt, opts = {}) {
  const response = await openai.chat.completions.create({
    model: opts.model || 'gpt-4',
    messages: [{ role: 'system', content: opts.system || 'You are a clinical assistant.' }, { role: 'user', content: prompt }],
    temperature: opts.temperature ?? 0.2,
    max_tokens: opts.max_tokens || 800
  });
  return response.data.choices[0].message.content;
}

module.exports = { chat };
