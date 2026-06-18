async function ollamaEmbed(text) {
  try {
    const response = await axios.post(
      `${OLLAMA_BASE_URL}/api/embeddings`,
      {
        model: EMBED_MODEL,
        prompt: text,
      }
    );

    return response.data.embedding;
  } catch (err) {
    console.error('OLLAMA ERROR:', err.message);

    if (err.response) {
      console.error('Response:', err.response.data);
    }

    throw err;
  }
}