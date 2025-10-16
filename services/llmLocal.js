
const axios = require('axios');
async function chat(prompt, opts = {}) {
  const endpoint = (process.env.LOCAL_LLM_ENDPOINT || 'http://localhost:11434').replace(/\/$/, '') + '/api/generate';
  const res = await axios.post(endpoint, { prompt, model: opts.model });
  return res.data.response || res.data.output || JSON.stringify(res.data);
}
module.exports = { chat };
