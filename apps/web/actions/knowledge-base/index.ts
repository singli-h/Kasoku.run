/*
<ai_context>
Knowledge base actions exports.
Provides centralized access to all knowledge base server actions.
</ai_context>
*/

// Category actions
export {
  getKnowledgeBaseCategoriesAction,
  createKnowledgeBaseCategoryAction,
  updateKnowledgeBaseCategoryAction,
  deleteKnowledgeBaseCategoryAction,
} from './knowledge-base-actions'

// Article actions
export {
  getKnowledgeBaseArticlesAction,
  getKnowledgeBaseArticlesByCategoryAction,
  getKnowledgeBaseArticleAction,
  createKnowledgeBaseArticleAction,
  updateKnowledgeBaseArticleAction,
  deleteKnowledgeBaseArticleAction,
} from './knowledge-base-actions'
