import React, { useState, useEffect, useMemo } from 'react';
import cardsData from './cards.json';
import './styles.css';

const RARITY_CHANCES = {
  LR:  0.005,
  SSR: 0.03,
  UR:  0.01,
  SR:  0.055,
  R:   0.15,
  UC:  0.25,
  C:   0.50 
};

const CARDS_PER_PACK = 7;

export default function BibleGachaApp() {
  const [view, setView] = useState('home'); // 'home', 'sealed_pack', 'opening', 'collection'
  const [collection, setCollection] = useState([]);
  const [currentPack, setCurrentPack] = useState([]);
  const [revealIndex, setRevealIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [isTearing, setIsTearing] = useState(false); // New animation state

  useEffect(() => {
    try {
      const saved = localStorage.getItem('bibleGachaCollection');
      if (saved) setCollection(JSON.parse(saved));
    } catch (e) {
      console.error("Failed to load collection", e);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('bibleGachaCollection', JSON.stringify(collection));
  }, [collection]);

  const cardsByRarity = useMemo(() => {
    const grouped = { LR: [], SSR: [], UR: [], SR: [], R: [], UC: [], C: [] };
    cardsData.forEach(card => {
      const r = card.Rarity;
      if (grouped[r]) grouped[r].push(card);
    });
    return grouped;
  }, []);

  const openPack = () => {
    const newPack = [];
    for (let i = 0; i < CARDS_PER_PACK; i++) {
      const rand = Math.random();
      let cumulative = 0;
      let selectedRarity = 'C'; 
      
      for (const [rarity, chance] of Object.entries(RARITY_CHANCES)) {
        cumulative += chance;
        if (rand <= cumulative) {
          selectedRarity = rarity;
          break;
        }
      }

      const pool = cardsByRarity[selectedRarity].length > 0 ? cardsByRarity[selectedRarity] : cardsByRarity['C'];
      if (pool && pool.length > 0) {
        newPack.push(pool[Math.floor(Math.random() * pool.length)]);
      }
    }

    if (newPack.length > 0) {
      const newCollection = new Set([...collection, ...newPack.map(c => c.Card_ID)]);
      setCollection(Array.from(newCollection));
      setCurrentPack(newPack);
      setRevealIndex(0);
      setFlipped(false);
      setIsTearing(false);
      setView('sealed_pack'); // Go to the foil pack first!
    }
  };

  // Triggers the CSS rip animation, then moves to the cards
  const handleTearPack = () => {
    setIsTearing(true);
    setTimeout(() => {
      setView('opening');
    }, 1200); 
  };

  const nextCard = () => {
    if (revealIndex < currentPack.length - 1) {
      setFlipped(false);
      setTimeout(() => setRevealIndex(prev => prev + 1), 300); 
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
      stats[rarity] = { collected, total, percentage: Math.round((collected / total) * 100) };
    });
    return stats;
  };

  const formatCardName = (id) => id ? id.split('_')[0].replace(/-/g, ' ') : "Unknown";

  return (
    <div className="app-container">
      <nav className="navbar">
        <h2>BibleMon</h2>
        <div>
          <button onClick={() => setView('home')}>Home</button>
          <button onClick={() => setView('collection')}>Collection</button>
        </div>
      </nav>

      {/* HOME VIEW */}
      {view === 'home' && (
        <div className="home-screen">
          <h1>Ready to pull?</h1>
          <button className="open-btn" onClick={openPack}>Open a Pack</button>
        </div>
      )}

      {/* SEALED PACK VIEW (NEW) */}
      {view === 'sealed_pack' && (
        <div className="pack-opening-container">
          <h2>Tap the pack to tear it open!</h2>
          
          <div 
            className={`booster-pack ${isTearing ? 'is-tearing' : ''}`} 
            onClick={!isTearing ? handleTearPack : undefined}
          >
            {/* The top section that rips off */}
            <div className="pack-foil-top">
               <div className="pack-crimp top-crimp"></div>
               <div className="tear-line"></div>
            </div>
            
            {/* The main body of the foil pack */}
            <div className="pack-body">
              <div className="pack-logo">BibleMon</div>
              <div className="pack-subtitle">7 Cards Inside</div>
              <div className="pack-art">✨</div>
              <div className="pack-crimp bottom-crimp"></div>
            </div>
          </div>
        </div>
      )}

      {/* PACK OPENING VIEW (CARD REVEAL) */}
      {view === 'opening' && currentPack.length > 0 && currentPack[revealIndex] && (
        <div className="opening-screen">
          <h3>Card {revealIndex + 1} of {currentPack.length}</h3>
          <div className="card-container" onClick={() => setFlipped(true)}>
            <div className={`card-inner ${flipped ? 'flipped' : ''}`}>
              <div className="card-back"><div className="card-design">TAP TO REVEAL</div></div>
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
                <strong>{rarity}</strong><p>{stat.collected} / {stat.total}</p>
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${stat.percentage}%` }}></div></div>
              </div>
            ))}
          </div>
          <div className="card-grid">
            {collection.map(id => {
              const card = cardsData.find(c => c.Card_ID === id);
              if (!card) return null;
              return (
                <div key={id} className={`mini-card rarity-${card.Rarity}`}>
                  <strong>{formatCardName(card.Card_ID)}</strong><span>{card.Rarity}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

