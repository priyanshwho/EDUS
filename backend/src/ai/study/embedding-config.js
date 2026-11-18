const EMBEDDING_MODEL = 'intfloat/multilingual-e5-small';
const EMBEDDING_REVISION = '614241f622f53c4eeff9890bdc4f31cfecc418b3';

function embeddingIdentity(env = process.env) {
  const model = env.STUDY_EMBEDDING_MODEL || EMBEDDING_MODEL;
  const revision = env.STUDY_EMBEDDING_REVISION || EMBEDDING_REVISION;
  if (model !== EMBEDDING_MODEL || !/^[0-9a-f]{40}$/.test(revision)) throw new Error('Use the reviewed embedding model and an immutable revision.');
  return { model, revision };
}

module.exports = { embeddingIdentity, EMBEDDING_MODEL, EMBEDDING_REVISION };
