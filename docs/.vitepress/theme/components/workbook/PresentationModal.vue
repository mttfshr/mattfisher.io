  gap: 1rem;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.nav-button,
.close-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1.2rem;
}

.nav-button:hover,
.close-button:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
}

.close-button:hover {
  background: rgba(255, 0, 0, 0.2);
  border-color: rgba(255, 0, 0, 0.3);
}

/* Main content */
.presentation-content {
  flex: 1;
  padding: 2rem;
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 2rem;
  overflow: hidden;
}

.media-section {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
}

.presentation-media {
  max-width: 100%;
  max-height: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

/* Info panel */
.info-panel {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  overflow-y: auto;
}

.description {
  margin-bottom: 2rem;
}

.description p {
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
  margin: 0;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.action-button {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  text-align: center;
  transition: all 0.2s ease;
  background: rgba(255, 255, 255, 0.9);
  color: #000;
}

.action-button:hover {
  background: white;
}

/* Responsive design */
@media (max-width: 768px) {
  .presentation-content {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr auto;
  }
  
  .info-panel {
    max-height: 200px;
  }
  
  .presentation-header {
    padding: 1rem;
  }
  
  .presentation-content {
    padding: 1rem;
  }
}
</style>
