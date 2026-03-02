"use client";

import React, { useEffect, useState } from "react";

interface StatsData {
  events: number;
  churches: number;
  users: number;
  media: number;
}

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<StatsData>({
    events: 0,
    churches: 0,
    users: 0,
    media: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch counts from Payload API
        const [eventsRes, churchesRes, usersRes, mediaRes] = await Promise.all([
          fetch("/payload-api/news-events?limit=0").catch(() => null),
          fetch("/payload-api/churches?limit=0").catch(() => null),
          fetch("/payload-api/users?limit=0").catch(() => null),
          fetch("/payload-api/media?limit=0").catch(() => null),
        ]);

        const events = eventsRes ? await eventsRes.json().catch(() => ({})) : {};
        const churches = churchesRes ? await churchesRes.json().catch(() => ({})) : {};
        const users = usersRes ? await usersRes.json().catch(() => ({})) : {};
        const media = mediaRes ? await mediaRes.json().catch(() => ({})) : {};

        setStats({
          events: events.totalDocs || 0,
          churches: churches.totalDocs || 0,
          users: users.totalDocs || 0,
          media: media.totalDocs || 0,
        });
      } catch {
        // Silently fail - show zeros
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const quickLinks = [
    {
      title: "Create Event",
      description: "Add a new event or announcement",
      href: "/cms/collections/news-events/create",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <line x1="12" y1="14" x2="12" y2="18" />
          <line x1="10" y1="16" x2="14" y2="16" />
        </svg>
      ),
      color: "#c9a227",
    },
    {
      title: "Manage Churches",
      description: "View and edit church locations",
      href: "/cms/collections/churches",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 21h18" />
          <path d="M5 21V7l7-4 7 4v14" />
          <path d="M9 21v-6h6v6" />
          <path d="M12 7v4" />
          <path d="M10 9h4" />
        </svg>
      ),
      color: "#1e3a5f",
    },
    {
      title: "Upload Media",
      description: "Add images and documents",
      href: "/cms/collections/media/create",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21,15 16,10 5,21" />
        </svg>
      ),
      color: "#10b981",
    },
    {
      title: "View Website",
      description: "Open the public website",
      href: "/",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      ),
      color: "#8b5cf6",
    },
  ];

  const collections = [
    { name: "News & Events", href: "/cms/collections/news-events", count: stats.events },
    { name: "Churches", href: "/cms/collections/churches", count: stats.churches },
    { name: "Media Library", href: "/cms/collections/media", count: stats.media },
    { name: "Users", href: "/cms/collections/users", count: stats.users },
  ];

  return (
    <div className="pmcc-dashboard">
      {/* Header */}
      <div className="pmcc-dashboard__header">
        <div className="pmcc-dashboard__welcome">
          <h1>Welcome to PMCC Admin</h1>
          <p>Manage your church content, events, and more from this dashboard.</p>
        </div>
        <div className="pmcc-dashboard__date">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="pmcc-dashboard__stats">
        <div className="pmcc-stat-card pmcc-stat-card--events">
          <div className="pmcc-stat-card__icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div className="pmcc-stat-card__content">
            <span className="pmcc-stat-card__value">{loading ? "-" : stats.events}</span>
            <span className="pmcc-stat-card__label">Events</span>
          </div>
        </div>

        <div className="pmcc-stat-card pmcc-stat-card--churches">
          <div className="pmcc-stat-card__icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 21h18" />
              <path d="M5 21V7l7-4 7 4v14" />
              <path d="M9 21v-6h6v6" />
              <path d="M12 7v4" />
              <path d="M10 9h4" />
            </svg>
          </div>
          <div className="pmcc-stat-card__content">
            <span className="pmcc-stat-card__value">{loading ? "-" : stats.churches}</span>
            <span className="pmcc-stat-card__label">Churches</span>
          </div>
        </div>

        <div className="pmcc-stat-card pmcc-stat-card--users">
          <div className="pmcc-stat-card__icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="pmcc-stat-card__content">
            <span className="pmcc-stat-card__value">{loading ? "-" : stats.users}</span>
            <span className="pmcc-stat-card__label">Users</span>
          </div>
        </div>

        <div className="pmcc-stat-card pmcc-stat-card--media">
          <div className="pmcc-stat-card__icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21,15 16,10 5,21" />
            </svg>
          </div>
          <div className="pmcc-stat-card__content">
            <span className="pmcc-stat-card__value">{loading ? "-" : stats.media}</span>
            <span className="pmcc-stat-card__label">Media Files</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="pmcc-dashboard__section">
        <h2>Quick Actions</h2>
        <div className="pmcc-dashboard__quick-actions">
          {quickLinks.map((link) => (
            <a
              key={link.title}
              href={link.href}
              className="pmcc-quick-action"
              target={link.href === "/" ? "_blank" : undefined}
              rel={link.href === "/" ? "noopener noreferrer" : undefined}
            >
              <div
                className="pmcc-quick-action__icon"
                style={{
                  backgroundColor: `${link.color}15`,
                  color: link.color
                }}
              >
                {link.icon}
              </div>
              <div className="pmcc-quick-action__content">
                <h3>{link.title}</h3>
                <p>{link.description}</p>
              </div>
              <div className="pmcc-quick-action__arrow">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12,5 19,12 12,19" />
                </svg>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Collections Overview */}
      <div className="pmcc-dashboard__section">
        <h2>Content Overview</h2>
        <div className="pmcc-dashboard__collections">
          {collections.map((collection) => (
            <a
              key={collection.name}
              href={collection.href}
              className="pmcc-collection-card"
            >
              <div className="pmcc-collection-card__info">
                <h3>{collection.name}</h3>
                <span className="pmcc-collection-card__count">
                  {loading ? "-" : collection.count} items
                </span>
              </div>
              <div className="pmcc-collection-card__action">
                View All
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9,18 15,12 9,6" />
                </svg>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="pmcc-dashboard__footer">
        <p>PMCC 4th Watch - US District Admin Panel</p>
        <p>Need help? Contact <a href="mailto:support@pmcc4thwatch.us">support@pmcc4thwatch.us</a></p>
      </div>
    </div>
  );
};

export default Dashboard;
