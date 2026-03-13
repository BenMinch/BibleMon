import React, { useState, useEffect, useMemo } from 'react';
import cardsData from './cards.json';
import './styles.css';

// 1. DEFINE YOUR DROP RATES HERE
const RARITY_CHANCES = {
  UR: 0.03, // 3% chance
  SR: 0.12, // 12% chance
  R: 0.35,  // 35% chance
  C: 0.50   // 50% chance
};

const CARDS_PER_PACK = 7;

export default function BibleGachaApp() {
  const [view, setView] = useState('home'); // 'home', 'opening', 'collection'
  const [collection, setCollection] = useState([]);
  const [currentPack, setCurrentPack] = useState([]);
  const [revealIndex, setRevealIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Load collection from local storage on startup
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bibleGachaCollection');
      if (saved) {
        setCollection(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load collection", e);
    }
  }, []);

  // Save collection whenever it updates
  useEffect(() => {
    localStorage.setItem('bibleGachaCollection', JSON.stringify(collection));
  }, [collection]);

  // Organize cards by rarity safely
  const cardsByRarity = useMemo(() => {
    const grouped = { UR: [], SR: [], R: [], C: [] };
    cardsData.forEach(card => {
      const r = card.Rarity;
      if (grouped[r]) {
        grouped[r].push(card);
      }
    });
    return grouped;
  }, []);

  const openPack = () => {
    const newPack = [];
    for (let i = 0; i < CARDS_PER_PACK; i++) {
      const rand = Math.random();
      let cumulative = 0;
      let selectedRarity = 'C'; // Fallback rarity
      
      for (const [rarity, chance] of Object.entries(RARITY_CHANCES)) {
        cumulative += chance;
        if (rand <= cumulative) {
          selectedRarity = rarity;
          break;
        }
      }

      const pool = cardsByRarity[selectedRarity];
      if (pool && pool.length > 0) {
        const pulledCard = pool[Math.floor(Math.random() * pool.length)];
        newPack.push(pulledCard);
      }
    }

    if (newPack.length > 0) {
      // Add to collection (keeping unique IDs)
      const newCollection = new Set([...collection, ...newPack.map(c => c.Card_ID)]);
      setCollection(Array.from(newCollection));
      setCurrentPack(newPack);
      setRevealIndex(0);
      setFlipped(false);
      setView('opening');
    } else {
      alert("Error: No cards available to pull. Check your cards.json data!");
    }
  };

  const nextCard = () => {
    if (revealIndex < currentPack.length - 1) {
      setFlipped(false);
      setTimeout(() => {
        setRevealIndex(prev => prev + 1);
      }, 300); // Wait for flip animation to reset before changing data
    } else {
      setView('home');
    }
  };

  const getCollectionStats = () => {
    const stats = {};
    Object.keys(cardsByRarity).forEach(rarity => {
      const total = cardsByRarity[rarity].length;
      if (total === 0) return;
      
      const collected = collection.filter(id => {
        const card = cardsData.find(c => c.Card_ID === id);
        return card && card.Rarity === rarity;
      }).length;
      
      stats[rarity] = { 
        collected, 
        total, 
        percentage: Math.round((collected / total) * 100) 
      };
    });
    return stats;
  };

  // Utility to format names nicely (e.g., "john_1" -> "John")
  const formatCardName = (id) => {
    if (!id) return "Unknown";
    return id.split('_')[0].replace(/-/g, ' ');
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <h2>BibleGacha</h2>
        <div>
          <button onClick={() => setView('home')}>Home</button>
          <button onClick={() => setView('collection')}>Collection</button>
        </div>
      </nav>

      {/* HOME VIEW */}
      {view === 'home' && (
        <div className="home-screen">
          <h1>Ready to pull?</h1>
          <button className="open-btn" onClick={openPack}>Open a Pack (7 Cards)</button>
        </div>
      )}

      {/* PACK OPENING VIEW */}
      {view === 'opening' && currentPack.length > 0 && currentPack[revealIndex] && (
        <div className="opening-screen">
          <h3>Card {revealIndex + 1} of {currentPack.length}</h3>
          
          <div className="card-container" onClick={() => setFlipped(true)}>
            <div className={`card-inner ${flipped ? 'flipped' : ''}`}>
              {/* Card Back (Unrevealed) */}
              <div className="card-back">
                <div className="card-design">TAP TO REVEAL</div>
              </div>
              
              {/* Card Front (Revealed) */}
              <div className={`card-front rarity-${currentPack[revealIndex].Rarity}`}>
                <span className="rarity-badge">{currentPack[revealIndex].Rarity}</span>
                <h2>{formatCardName(currentPack[revealIndex].Card_ID)}</h2>
                <p>{currentPack[revealIndex].description || "A biblical concept."}</p>
              </div>
            </div>
          </div>

          {flipped && (
            <button className="next-btn" onClick={nextCard}>
              {revealIndex < currentPack.length - 1 ? 'Next Card' : 'Finish Pack'}
            </button>
          )}
        </div>
      )}

      {/* COLLECTION VIEW */}
      {view === 'collection' && (
        <div className="collection-screen">
          <h1>Your Collection</h1>
          <div className="stats-grid">
            {Object.entries(getCollectionStats()).map(([rarity, stat]) => (
              <div key={rarity} className="stat-box">
                <strong>{rarity}</strong>
                <p>{stat.collected} / {stat.total}</p>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${stat.percentage}%` }}></div>
                </div>
                <small>{stat.percentage}% Complete</small>
              </div>
            ))}
          </div>
          
          <div className="card-grid">
            {collection.map(id => {
              const card = cardsData.find(c => c.Card_ID === id);
              if (!card) return null;
              return (
                <div key={id} className={`mini-card rarity-${card.Rarity}`}>
                  <strong>{formatCardName(card.Card_ID)}</strong>
                  <span>{card.Rarity}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
