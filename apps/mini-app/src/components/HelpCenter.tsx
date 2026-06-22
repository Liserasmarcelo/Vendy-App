import React, { useState, useEffect } from 'react';
import { useHelp } from '../hooks/useHelp';
import { useTranslation } from 'react-i18next';

// ==========================================
// HELP CENTER COMPONENT
// ==========================================
export function HelpCenter() {
  const { t } = useTranslation('support');
  const {
    categories,
    articles,
    faqs,
    searchResults,
    isLoading,
    fetchCategories,
    fetchArticles,
    fetchFAQs,
    search,
  } = useHelp();
  
  const [activeTab, setActiveTab] = useState<'articles' | 'faqs'>('articles');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
    fetchArticles();
    fetchFAQs();
  }, [fetchCategories, fetchArticles, fetchFAQs]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchQuery.length >= 2) {
        search(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery, search]);

  const displayedArticles = searchResults?.articles || 
    (selectedCategory 
      ? articles.filter(a => a.category === selectedCategory)
      : articles);

  const displayedFAQs = searchResults?.faqs || 
    (selectedCategory 
      ? faqs.filter(f => f.category === selectedCategory)
      : faqs);

  const articleContent = selectedArticle 
    ? articles.find(a => a.id === selectedArticle)
    : null;

  return (
    <div className="help-center">
      <header className="help-header">
        <h1>📚 {t('title')}</h1>
        
        <div className="search-box">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar ayuda..."
            className="search-input"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="clear-search">
              ✕
            </button>
          )}
        </div>
      </header>

      {searchResults && (
        <div className="search-results-info">
          {searchResults.total} resultados encontrados
        </div>
      )}

      {/* Categories */}
      <div className="categories-grid">
        <button
          className={!selectedCategory ? 'active' : ''}
          onClick={() => setSelectedCategory(null)}
        >
          📁 Todas
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            className={selectedCategory === cat.id ? 'active' : ''}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.icon} {cat.name}
            <span className="count">{cat.articleCount}</span>
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="help-tabs">
        <button
          className={activeTab === 'articles' ? 'active' : ''}
          onClick={() => setActiveTab('articles')}
        >
          📄 Artículos
        </button>
        <button
          className={activeTab === 'faqs' ? 'active' : ''}
          onClick={() => setActiveTab('faqs')}
        >
          ❓ FAQs
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="loading">Cargando...</div>
      ) : articleContent ? (
        <ArticleView 
          article={articleContent} 
          onBack={() => setSelectedArticle(null)} 
        />
      ) : activeTab === 'articles' ? (
        <div className="articles-list">
          {displayedArticles.length === 0 ? (
            <p className="empty">No hay artículos</p>
          ) : (
            displayedArticles.map(article => (
              <div
                key={article.id}
                className="article-card"
                onClick={() => setSelectedArticle(article.id)}
              >
                <h3>{article.title}</h3>
                <div className="article-meta">
                  <span>👁 {article.viewCount} vistas</span>
                  <span>👍 {article.helpfulCount} útil</span>
                  {article.tags.map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <FAQList faqs={displayedFAQs} />
      )}
    </div>
  );
}

// ==========================================
// ARTICLE VIEW
// ==========================================
function ArticleView({ article, onBack }: { article: any; onBack: () => void }) {
  const { addFeedback } = useHelp();
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  const handleFeedback = (helpful: boolean) => {
    addFeedback(article.id, helpful);
    setFeedbackGiven(true);
  };

  return (
    <div className="article-view">
      <button onClick={onBack} className="back-btn">← Volver</button>
      
      <h2>{article.title}</h2>
      
      <div className="article-content" dangerouslySetInnerHTML={{ __html: article.content }} />
      
      <div className="article-feedback">
        <p>¿Te fue útil este artículo?</p>
        {!feedbackGiven ? (
          <div className="feedback-buttons">
            <button onClick={() => handleFeedback(true)}>👍 Sí</button>
            <button onClick={() => handleFeedback(false)}>👎 No</button>
          </div>
        ) : (
          <p className="feedback-thanks">¡Gracias por tu feedback!</p>
        )}
      </div>
    </div>
  );
}

// ==========================================
// FAQ LIST
// ==========================================
function FAQList({ faqs }: { faqs: any[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { addFAQFeedback } = useHelp();
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, boolean>>({});

  const toggleFAQ = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleFeedback = (faqId: string, helpful: boolean) => {
    addFAQFeedback(faqId, helpful);
    setFeedbackGiven(prev => ({ ...prev, [faqId]: true }));
  };

  if (faqs.length === 0) {
    return <p className="empty">No hay FAQs</p>;
  }

  return (
    <div className="faq-list">
      {faqs.map(faq => (
        <div key={faq.id} className={`faq-item ${expandedId === faq.id ? 'expanded' : ''}`}>
          <button className="faq-question" onClick={() => toggleFAQ(faq.id)}>
            <span>{faq.question}</span>
            <span className="toggle">{expandedId === faq.id ? '−' : '+'}</span>
          </button>
          
          {expandedId === faq.id && (
            <div className="faq-answer">
              <p>{faq.answer}</p>
              
              <div className="faq-feedback">
                <p>¿Te fue útil?</p>
                {!feedbackGiven[faq.id] ? (
                  <div className="feedback-buttons">
                    <button onClick={() => handleFeedback(faq.id, true)}>👍</button>
                    <button onClick={() => handleFeedback(faq.id, false)}>👎</button>
                  </div>
                ) : (
                  <span className="feedback-thanks">¡Gracias!</span>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
