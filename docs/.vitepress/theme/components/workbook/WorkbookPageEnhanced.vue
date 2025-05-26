255, 255, 255, 0.2);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
}

.nav-tab.active .tab-count {
  background: rgba(255, 255, 255, 0.3);
}

/* Folio View */
.folio-view {
  max-width: 1000px;
  margin: 0 auto;
}

.folio-item {
  margin-bottom: var(--space-8);
}

.folio-main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-12);
  align-items: start;
}

.folio-media {
  position: sticky;
  top: var(--space-8);
}

.folio-content {
  padding: var(--space-4) 0;
}

.folio-header {
  margin-bottom: var(--space-6);
}

.folio-title {
  font-size: var(--text-4xl);
  margin: 0 0 var(--space-2);
  line-height: var(--leading-tight);
}

.folio-meta {
  display: flex;
  gap: var(--space-4);
  color: var(--vp-c-text-2);
  font-size: var(--text-sm);
}

.folio-description {
  font-size: var(--text-lg);
  line-height: var(--leading-relaxed);
  margin-bottom: var(--space-8);
  color: var(--vp-c-text-1);
}

/* Structured Tags */
.folio-tags {
  margin-bottom: var(--space-8);
}

.tag-group {
  margin-bottom: var(--space-4);
}

.tag-category {
  display: block;
  font-weight: var(--font-semibold);
  color: var(--vp-c-text-1);
  margin-bottom: var(--space-2);
  font-size: var(--text-sm);
}

.tag-values {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.tag-value {
  background: var(--vp-c-bg-soft);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-2xl);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: var(--transition-fast);
}

.tag-value:hover {
  background: var(--vp-c-brand-soft);
}

/* Actions */
.folio-actions {
  display: flex;
  gap: var(--space-4);
}

.action-button {
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-base);
  text-decoration: none;
  font-weight: var(--font-medium);
  transition: var(--transition-fast);
  border: none;
  cursor: pointer;
}

.action-button.primary {
  background: var(--vp-c-brand);
  color: white;
}

.action-button.secondary {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
}

.action-button:hover {
  transform: translateY(-1px);
}

/* Timeline */
.folio-timeline {
  margin-top: var(--space-12);
  padding: var(--space-8) 0;
  border-top: var(--border-width) solid var(--vp-c-divider);
}

.timeline-track {
  position: relative;
  height: 40px;
  background: var(--vp-c-bg-soft);
  border-radius: var(--radius-2xl);
}

.timeline-point {
  position: absolute;
  width: var(--space-3);
  height: var(--space-3);
  background: var(--vp-c-text-3);
  border-radius: var(--radius-full);
  top: 50%;
  transform: translate(-50%, -50%);
  cursor: pointer;
  transition: var(--transition-fast);
}

.timeline-point.active {
  background: var(--vp-c-brand);
  width: var(--space-4);
  height: var(--space-4);
}

.timeline-point:hover {
  background: var(--vp-c-brand);
  transform: translate(-50%, -50%) scale(1.2);
}

.timeline-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: var(--vp-c-bg);
  border: var(--border-width) solid var(--vp-c-divider);
  border-radius: var(--radius-sm);
  padding: var(--space-2);
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: var(--transition-fast);
  margin-bottom: var(--space-2);
}

.timeline-point:hover .timeline-tooltip {
  opacity: 1;
}

.tooltip-title {
  display: block;
  font-weight: var(--font-medium);
  font-size: var(--text-sm);
}

.tooltip-year {
  display: block;
  color: var(--vp-c-text-2);
  font-size: var(--text-xs);
}

/* Collections Grid */
.collections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-8);
}

.collection-card {
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--vp-c-bg-soft);
  cursor: pointer;
  transition: var(--transition-base);
}

.collection-card:hover {
  transform: translateY(-4px);
}

.collection-preview {
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: 200px;
}

.preview-item {
  overflow: hidden;
}

.preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.collection-info {
  padding: var(--space-6);
}

.collection-title {
  margin: 0 0 var(--space-2);
  font-size: var(--text-xl);
}

.collection-description {
  color: var(--vp-c-text-2);
  margin-bottom: var(--space-4);
  line-height: var(--leading-normal);
}

.collection-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--text-sm);
  color: var(--vp-c-text-3);
}

.collections-intro {
  text-align: center;
  margin-bottom: var(--space-12);
}

.collections-intro p {
  font-size: var(--text-lg);
  color: var(--vp-c-text-2);
}

.no-collections {
  text-align: center;
  padding: var(--space-12);
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-soft);
  border-radius: var(--radius-md);
}

/* Enhanced Grid */
.enhanced-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-6);
}

.enhanced-gallery.large-grid {
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
}

.gallery-item {
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: pointer;
  transition: var(--transition-base);
  background: var(--vp-c-bg-soft);
}

.gallery-item:hover {
  transform: translateY(-2px);
}

.item-media {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.item-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: var(--transition-base);
}

.gallery-item:hover .item-overlay {
  opacity: 1;
}

.overlay-button {
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: var(--radius-full);
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: var(--text-xl);
}

.item-info {
  padding: var(--space-4);
  background: var(--vp-c-bg);
}

.item-title {
  margin: 0 0 var(--space-2);
  font-size: var(--text-lg);
}

.item-meta {
  display: flex;
  gap: var(--space-4);
  color: var(--vp-c-text-2);
  font-size: var(--text-sm);
}

/* Controls */
.view-controls {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.folio-controls {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.control-button {
  padding: var(--space-2) var(--space-4);
  border: var(--border-width) solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  border-radius: var(--radius-base);
  cursor: pointer;
  transition: var(--transition-fast);
}

.control-button:hover:not(:disabled) {
  background: var(--vp-c-bg-soft);
}

.control-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.position-indicator {
  font-size: var(--text-sm);
  color: var(--vp-c-text-2);
  white-space: nowrap;
}

.grid-controls {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.sort-select {
  padding: var(--space-2);
  border: var(--border-width) solid var(--vp-c-divider);
  border-radius: var(--radius-sm);
  background: var(--vp-c-bg);
}

.view-toggle {
  background: var(--vp-c-bg-soft);
  border: none;
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition-fast);
}

.view-toggle.active {
  background: var(--vp-c-brand-soft);
}

/* Related Items */
.folio-related {
  margin-top: var(--space-8);
  padding-top: var(--space-8);
  border-top: var(--border-width) solid var(--vp-c-divider);
}

.folio-related h3 {
  margin-bottom: var(--space-4);
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: var(--space-4);
}

.related-item {
  cursor: pointer;
  border-radius: var(--radius-base);
  overflow: hidden;
  transition: var(--transition-base);
}

.related-item:hover {
  transform: scale(1.05);
}

.related-item img {
  width: 100%;
  height: 100px;
  object-fit: cover;
}

.related-title {
  display: block;
  padding: var(--space-2);
  font-size: var(--text-sm);
  background: var(--vp-c-bg-soft);
}

/* Responsive Design */
@media (max-width: 768px) {
  .workbook-navigation {
    flex-direction: column;
    gap: var(--space-4);
    align-items: stretch;
  }
  
  .folio-main {
    grid-template-columns: 1fr;
    gap: var(--space-8);
  }
  
  .folio-title {
    font-size: var(--text-3xl);
  }
  
  .folio-actions {
    flex-direction: column;
  }
  
  .enhanced-gallery {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }
  
  .enhanced-gallery.large-grid {
    grid-template-columns: 1fr;
  }
  
  .collections-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .nav-tabs {
    flex-direction: column;
    width: 100%;
  }
  
  .nav-tab {
    justify-content: center;
  }
  
  .enhanced-gallery {
    grid-template-columns: 1fr;
  }
}
</style>
