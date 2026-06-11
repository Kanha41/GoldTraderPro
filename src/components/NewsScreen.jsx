import React, { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import MobileNavBar from './MobileNavBar';
import {
  Newspaper,
  Calendar,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Radio
} from 'lucide-react';
import { fetchGoldNews } from '../services/goldNewsApi';

const NewsScreen = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedSource, setFeedSource] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadNews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { articles: fetched, source } = await fetchGoldNews();
      setArticles(fetched);
      setFeedSource(source);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err?.message || 'Unable to load gold market news. Please try again.');
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNews();
    const interval = setInterval(loadNews, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadNews]);

  const formatArticleDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      if (Number.isNaN(d.getTime())) return 'Recently';
      return formatDistanceToNow(d, { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0b0e14',
        backgroundImage: 'radial-gradient(circle at top, rgba(18, 30, 54, 0.8), #0b0e14)',
        color: 'var(--text-primary)',
        padding: '30px 15px 90px 15px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      <div style={{ maxWidth: '480px', width: '100%' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            gap: '12px'
          }}
        >
          <h2
            style={{
              fontSize: '26px',
              fontWeight: '700',
              letterSpacing: '-0.02em',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              margin: 0
            }}
          >
            <Newspaper size={24} color="var(--accent)" /> Gold News
          </h2>
          <button
            onClick={loadNews}
            disabled={loading}
            className="btn btn-outline"
            style={{
              padding: '8px 12px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: loading ? 0.6 : 1
            }}
            aria-label="Refresh news"
          >
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            fontSize: '11px',
            color: 'var(--text-secondary)'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Radio size={12} color="var(--buy-color)" />
            <span style={{ color: 'var(--buy-color)', fontWeight: '600' }}>LIVE</span>
            Gold &amp; precious metals market
          </span>
          {lastUpdated && !loading && (
            <span>Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}</span>
          )}
        </div>

        {feedSource && !loading && !error && (
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '0 0 14px 0' }}>
            Source:{' '}
            {feedSource === 'gnews'
              ? 'GNews (live, gold-filtered)'
              : feedSource === 'kitco'
                ? 'Kitco News (live)'
                : 'Reddit gold communities'}
            {!import.meta.env.VITE_GNEWS_API_KEY && (
              <span style={{ display: 'block', marginTop: '4px', color: 'var(--accent)' }}>
                Add VITE_GNEWS_API_KEY in .env for broader live coverage.
              </span>
            )}
          </p>
        )}

        {loading && articles.length === 0 && (
          <div
            className="glass-panel"
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              borderRadius: '14px'
            }}
          >
            <RefreshCw
              size={28}
              color="var(--accent)"
              style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }}
            />
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '14px' }}>
              Loading latest gold market news…
            </p>
          </div>
        )}

        {error && !loading && (
          <div
            className="glass-panel"
            style={{
              padding: '24px 18px',
              borderRadius: '14px',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              marginBottom: '16px'
            }}
          >
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <AlertCircle size={20} color="var(--sell-color)" style={{ flexShrink: 0 }} />
              <div>
                <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {error}
                </p>
                <button onClick={loadNews} className="btn btn-outline" style={{ fontSize: '12px' }}>
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {articles.map((art) => (
            <article
              key={art.id}
              className="glass-panel"
              style={{
                borderRadius: '14px',
                padding: '18px',
                textAlign: 'left',
                border: '1px solid var(--panel-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              {art.image && (
                <img
                  src={art.image}
                  alt=""
                  style={{
                    width: '100%',
                    height: '140px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    border: '1px solid var(--panel-border)'
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: '11px',
                    color: 'var(--accent)',
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}
                >
                  {art.source}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Calendar size={11} /> {formatArticleDate(art.date)}
                </span>
              </div>

              <h3
                style={{
                  fontSize: '15px',
                  fontWeight: '700',
                  lineHeight: '1.4',
                  margin: 0,
                  color: '#fff'
                }}
              >
                {art.title}
              </h3>

              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.5',
                  margin: 0
                }}
              >
                {art.summary}
              </p>

              {art.url ? (
                <a
                  href={art.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: 'none',
                    color: '#fff',
                    border: 'none',
                    fontSize: '11px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    padding: 0,
                    width: 'fit-content',
                    marginTop: '4px',
                    textDecoration: 'none'
                  }}
                >
                  Read full article <ExternalLink size={11} color="var(--accent)" />
                </a>
              ) : null}
            </article>
          ))}
        </div>
      </div>
      <MobileNavBar activeTab="news" />
    </div>
  );
};

export default NewsScreen;
