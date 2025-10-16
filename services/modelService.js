
const { poolPromise } = require('../config/db');
const OpenAI = require('openai');
const axios = require('axios');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Simple model registry in DB is optional; for now we provide in-memory list and DB-aware functions
const models = [
  { key: 'openai-gpt4', name: 'OpenAI GPT-4', type: 'openai', config: { model: 'gpt-4', temperature: 0.2 } },
  { key: 'local-llm', name: 'Local LLM', type: 'local', endpoint: process.env.LOCAL_LLM_ENDPOINT || '' }
];
let activeModelKey = models[0].key;

exports.listModels = async (req, res) => {
  res.json({ active: activeModelKey, models });
};

exports.activateModel = async (req, res) => {
  const key = req.params.key;
  if (!models.find(m => m.key === key)) return res.status(404).json({ error: 'Model not found' });
  activeModelKey = key;
  res.json({ success: true, active: activeModelKey });
};

async function callOpenAI(prompt, cfg) {
  const resp = await openai.chat.completions.create({
    model: cfg.model || 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: cfg.temperature ?? 0.2,
    max_tokens: 800
  });
  return { text: resp.data.choices[0].message.content, meta: resp.data };
}

async function callLocal(prompt, endpoint) {
  const resp = await axios.post(endpoint.replace(/\/$/, '') + '/api/generate', { prompt });
  return { text: resp.data.response || resp.data.output || JSON.stringify(resp.data), meta: resp.data };
}

exports.generateFromModel = async ({ input, modelKey }) => {
  const model = models.find(m => m.key === (modelKey || activeModelKey));
  if (!model) throw new Error('Model not found');
  if (model.type === 'openai') return await callOpenAI(input, model.config);
  if (model.type === 'local') return await callLocal(input, model.endpoint);
  throw new Error('Unsupported model type');
};

exports.generateResponse = async (req, res) => {
  const { input, modelKey } = req.body;
  try {
    const out = await exports.generateFromModel({ input, modelKey });
    res.json(out);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
