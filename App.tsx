import React, { useState, useEffect } from 'react';
import { ScreenState, GameItem, LeaderboardEntry, LevelConfig } from './types';
import { LEVELS } from './constants';
import { saveScore, getScores } from './services/leaderboardService';
import { Button } from './components/Button';

// -- Helper --
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenState>(ScreenState.WELCOME);
  const [userName, setUserName] = useState('');
  const [selectedLevelId, setSelectedLevelId] = useState<string>('1');
  
  // Game State
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  
  const [bankItems, setBankItems] = useState<GameItem[]>([]);
  const [placedItems, setPlacedItems] = useState<Record<string, GameItem[]>>({});
  
  // Feedback state
  const [incorrectZoneId, setIncorrectZoneId] = useState<string | null>(null);

  // Initialization
  useEffect(() => {
    let interval: any;
    if (isTimerRunning) {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const initializeGame = (levelId: string) => {
    setSelectedLevelId(levelId);
    const level = LEVELS[levelId];
    
    // Create game instances from definition
    const items: GameItem[] = level.items.map((def, idx) => ({
      id: `item-${idx}-${def.id}`,
      label: def.label,
      originalId: def.id,
      category: def.category
    }))
    .sort(() => Math.random() - 0.5);

    setBankItems(items);
    setPlacedItems({});
    setTimer(0);
    setMistakes(0);
    setIsTimerRunning(true);
    setCurrentScreen(ScreenState.GAME);
  };

  const handleDragStart = (e: React.DragEvent, item: GameItem, source: 'bank' | 'zone', sourceZoneId?: string) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ item, source, sourceZoneId }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetZoneId: string) => {
    e.preventDefault();
    const dataStr = e.dataTransfer.getData('application/json');
    if (!dataStr) return;

    const { item, source, sourceZoneId } = JSON.parse(dataStr) as { item: GameItem, source: 'bank' | 'zone', sourceZoneId?: string };
    
    const level = LEVELS[selectedLevelId];
    const targetZoneDef = level.rows.find(z => z.id === targetZoneId);
    if (!targetZoneDef) return;

    // --- Validation Logic ---
    // 1. Exact Label Match
    const isExactMatch = targetZoneDef.correctLabel === item.originalId;
    // 2. Category Match (if zone accepts category)
    const isCategoryMatch = !!targetZoneDef.acceptsCategory && targetZoneDef.acceptsCategory === item.category;

    const isCorrect = isExactMatch || isCategoryMatch;
    
    // Check if zone is already occupied (prevent stacking unless logic changes)
    if (placedItems[targetZoneId]?.length > 0) {
        // If it's the SAME item just being re-dropped, ignore
        if (placedItems[targetZoneId][0].id === item.id) return;
        // Otherwise, don't allow double fill
        return; 
    }

    if (isCorrect) {
        // --- CORRECT DROP ---
        
        // Remove from source
        if (source === 'bank') {
             // CLEANUP: Remove ALL instances of this specific item type from the bank to avoid "messy" duplicates.
             // If I successfully placed "Jualan", I don't need the other 2 penalty "Jualan" cards.
             setBankItems(prev => prev.filter(i => i.originalId !== item.originalId));
        } else if (source === 'zone' && sourceZoneId) {
            setPlacedItems(prev => ({
                ...prev,
                [sourceZoneId]: prev[sourceZoneId].filter(i => i.id !== item.id)
            }));
        }

        // Add to target
        setPlacedItems(prev => ({
            ...prev,
            [targetZoneId]: [item]
        }));
        
    } else {
        // --- INCORRECT DROP ---
        
        // Remove from source temporarily
        if (source === 'bank') {
            setBankItems(prev => prev.filter(i => i.id !== item.id));
        } else if (sourceZoneId) {
            setPlacedItems(prev => ({
                ...prev,
                [sourceZoneId]: prev[sourceZoneId].filter(i => i.id !== item.id)
            }));
        }

        // Add to target (visually)
        setPlacedItems(prev => ({
            ...prev,
            [targetZoneId]: [item]
        }));

        setIncorrectZoneId(targetZoneId);
        setMistakes(m => m + 1);

        // Penalty Logic
        setTimeout(() => {
            // Remove from the wrong zone
            setPlacedItems(prev => ({
                ...prev,
                [targetZoneId]: prev[targetZoneId].filter(i => i.id !== item.id)
            }));
            
            setIncorrectZoneId(null);

            // Add back to BANK with PENALTY (Multiply)
            const copy1: GameItem = { ...item, id: `${item.id}-copy1-${Date.now()}` };
            const copy2: GameItem = { ...item, id: `${item.id}-copy2-${Date.now()}` };
            
            setBankItems(prev => [...prev, item, copy1, copy2]);

        }, 3000);
    }
  };

  // Check Win Condition
  useEffect(() => {
    if (currentScreen !== ScreenState.GAME) return;

    // Win if Bank is Empty AND no items are in the "incorrect bounce" waiting state.
    // Also, theoretically, all zones that expect data should be filled.
    // However, with category logic, we rely on the bank being cleared as the primary signal.
    
    // We also need to check if there are any original items left to place.
    // Because we delete duplicates, bank length 0 is a good indicator, 
    // BUT we must ensure we haven't just deleted everything by accident.
    // The logic 'remove all duplicates on success' ensures we only remove when one is placed.
    // So if bank is empty, it means for every distinct item type, one instance has been placed.
    
    const isWaitingForBounce = incorrectZoneId !== null;
    
    if (bankItems.length === 0 && !isWaitingForBounce) {
        // Small delay to ensure render catches up
        setTimeout(() => {
             // Double check in timeout
             handleGameWin();
        }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bankItems, incorrectZoneId]);

  const handleGameWin = () => {
    setIsTimerRunning(false);
    const entry: LeaderboardEntry = {
        name: userName,
        levelId: selectedLevelId,
        score: mistakes,
        time: timer,
        timestamp: Date.now()
    };
    saveScore(entry);
    setCurrentScreen(ScreenState.LEADERBOARD);
  };

  // --- RENDERERS ---

  if (currentScreen === ScreenState.WELCOME) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-paper p-4">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full border border-stone-200">
          <h1 className="text-3xl font-serif text-center mb-6 text-stone-800 font-bold">Akaun Master</h1>
          <p className="text-center text-stone-500 mb-8">Masukkan nama anda untuk mula.</p>
          <input
            type="text"
            placeholder="Nama Pelajar"
            className="w-full p-3 border-2 border-stone-300 rounded mb-6 focus:border-blue-500 focus:outline-none font-mono"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
          <Button 
            disabled={!userName.trim()}
            className="w-full"
            onClick={() => setCurrentScreen(ScreenState.MENU)}
          >
            Seterusnya
          </Button>
        </div>
      </div>
    );
  }

  if (currentScreen === ScreenState.MENU) {
    return (
      <div className="min-h-screen bg-paper p-8">
        <div className="max-w-5xl mx-auto">
          <header className="flex justify-between items-center mb-12 border-b border-stone-300 pb-4">
            <h1 className="text-2xl font-serif font-bold">Selamat Datang, {userName}</h1>
            <Button variant="secondary" onClick={() => setCurrentScreen(ScreenState.LEADERBOARD)}>Lihat Rekod</Button>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div onClick={() => initializeGame('1')} className="bg-white p-6 rounded-lg shadow-md border-t-4 border-blue-500 hover:shadow-xl transition-all cursor-pointer group hover:-translate-y-1">
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-blue-600 font-bold">1</div>
              <h3 className="font-bold text-lg mb-2 group-hover:text-blue-600">Akaun Perdagangan</h3>
              <p className="text-xs text-stone-500">Jualan, Kos Jualan & Untung Kasar</p>
            </div>

            <div onClick={() => initializeGame('2')} className="bg-white p-6 rounded-lg shadow-md border-t-4 border-green-500 hover:shadow-xl transition-all cursor-pointer group hover:-translate-y-1">
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600 font-bold">2</div>
              <h3 className="font-bold text-lg mb-2 group-hover:text-green-600">Akaun Untung Rugi</h3>
              <p className="text-xs text-stone-500">Hasil, Belanja & Untung Bersih</p>
            </div>

            <div onClick={() => initializeGame('3')} className="bg-white p-6 rounded-lg shadow-md border-t-4 border-purple-500 hover:shadow-xl transition-all cursor-pointer group hover:-translate-y-1">
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mb-4 text-purple-600 font-bold">3</div>
              <h3 className="font-bold text-lg mb-2 group-hover:text-purple-600">Gabungan AP & UR</h3>
              <p className="text-xs text-stone-500">Penyata Lengkap Pendapatan</p>
            </div>

             <div onClick={() => initializeGame('4')} className="bg-white p-6 rounded-lg shadow-md border-t-4 border-orange-500 hover:shadow-xl transition-all cursor-pointer group hover:-translate-y-1">
              <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center mb-4 text-orange-600 font-bold">4</div>
              <h3 className="font-bold text-lg mb-2 group-hover:text-orange-600">PKK</h3>
              <p className="text-xs text-stone-500">Penyata Kedudukan Kewangan</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentScreen === ScreenState.LEADERBOARD) {
    return (
        <LeaderboardView onBack={() => setCurrentScreen(ScreenState.MENU)} />
    );
  }

  const activeLevel = LEVELS[selectedLevelId];

  // --- GAME VIEW ---
  return (
    <div className="min-h-screen bg-paperDark flex flex-col md:flex-row h-screen overflow-hidden">
      {/* Sidebar (Draggables) */}
      <div className="w-full md:w-1/4 bg-stone-800 text-stone-100 p-4 flex flex-col shadow-2xl z-20">
        <div className="mb-4 border-b border-stone-600 pb-4">
            <h2 className="text-lg font-bold text-blue-300">Bank Item</h2>
            <div className="mt-4 flex justify-between items-center bg-stone-900 p-2 rounded">
                <div className="text-center">
                    <span className="block text-xs text-stone-500">MASA</span>
                    <span className="font-mono text-xl">{formatTime(timer)}</span>
                </div>
                <div className="text-center">
                    <span className="block text-xs text-stone-500">KESILAPAN</span>
                    <span className="font-mono text-xl text-red-400">{mistakes}</span>
                </div>
            </div>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {bankItems.length === 0 && (
                <div className="text-center text-stone-500 py-10 italic">
                    Tiada item. Tahniah!
                </div>
            )}
            {bankItems.map((item) => (
                <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item, 'bank')}
                    className="bg-white text-ink p-2 rounded shadow cursor-grab active:cursor-grabbing hover:bg-blue-50 text-sm font-medium border-l-4 border-blue-500 select-none animate-in fade-in slide-in-from-left-2 duration-300"
                >
                    {item.label}
                </div>
            ))}
        </div>
        <div className="mt-4 pt-4 border-t border-stone-600">
             <Button variant="secondary" className="w-full text-xs" onClick={() => setCurrentScreen(ScreenState.MENU)}>Keluar</Button>
        </div>
      </div>

      {/* Main Area (Drop Zones) */}
      <div className="flex-1 overflow-y-auto p-2 md:p-8 flex justify-center bg-paper">
        <div className="bg-white w-full max-w-4xl shadow-lg border border-stone-300 p-6 md:p-12 relative min-h-max">
            {/* Paper Header */}
            <div className="text-center mb-8">
                <h1 className="text-2xl md:text-3xl font-serif font-bold uppercase tracking-wide text-ink mb-2">{activeLevel.title}</h1>
                <h2 className="text-lg md:text-xl font-serif font-bold text-ink border-b-2 border-black pb-2 inline-block">{activeLevel.subTitle}</h2>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 gap-0 border-b-2 border-black mb-1 pb-1 font-bold text-sm md:text-base">
                <div className="col-span-6"></div>
                <div className="col-span-2 text-right">RM</div>
                <div className="col-span-2 text-right">RM</div>
                <div className="col-span-2 text-right">RM</div>
            </div>

            {/* Rows */}
            <div className="space-y-1 font-serif text-sm md:text-base leading-relaxed pb-20">
                {activeLevel.rows.map((row) => {
                    const isError = incorrectZoneId === row.id;
                    const itemsInZone = placedItems[row.id] || [];
                    const isFilled = itemsInZone.length > 0;

                    // Header Row (Visual only)
                    if (row.isHeader) {
                        return (
                            <div key={row.id} className="grid grid-cols-12 gap-1 items-end mt-4 mb-2">
                                <div className="col-span-6 font-bold underline decoration-black underline-offset-2 uppercase">
                                    {row.correctLabel}
                                </div>
                            </div>
                        );
                    }

                    // Static Row (Visual only, e.g. Untung Kasar in Level 2)
                    if (row.isStatic) {
                        return (
                            <div key={row.id} className="grid grid-cols-12 gap-1 items-center font-bold">
                                <div className="col-span-6 pr-4">{row.correctLabel}</div>
                                <div className="col-span-2 text-right font-mono text-ink">{row.colIndex === 0 ? row.displayValue : ''}</div>
                                <div className="col-span-2 text-right font-mono text-ink">{row.colIndex === 1 ? row.displayValue : ''}</div>
                                <div className="col-span-2 text-right font-mono text-ink">{row.colIndex === 2 ? row.displayValue : ''}</div>
                            </div>
                        )
                    }

                    // Draggable Row
                    return (
                        <div key={row.id} className="grid grid-cols-12 gap-1 items-center min-h-[2.5rem]">
                            {/* Label Column (Droppable) */}
                            <div className="col-span-6 pr-4 relative">
                                <div 
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, row.id)}
                                    className={`
                                        relative min-h-[2.2rem] rounded flex flex-wrap gap-1 items-center transition-colors duration-300
                                        ${!isFilled ? 'bg-stone-100 border border-dashed border-stone-300 hover:bg-stone-200' : ''}
                                        ${isError ? 'bg-red-100 border-red-400 ring-2 ring-red-400' : ''}
                                        ${isFilled ? '' : 'shadow-inner'}
                                    `}
                                    style={{ marginLeft: `${(row.indent || 0) * 1.5}rem` }}
                                >
                                    {!isFilled && (
                                        <span className="absolute inset-0 flex items-center justify-start pl-2 text-stone-300 text-xs pointer-events-none italic">
                                            {row.acceptsCategory ? `(Item ${row.acceptsCategory})` : ''}
                                        </span>
                                    )}
                                    {itemsInZone.map(item => (
                                        <div 
                                            key={item.id} 
                                            className={`
                                                px-3 py-1 rounded shadow-sm text-sm font-medium w-full
                                                ${isError ? 'bg-red-500 text-white' : 'bg-white border-l-4 border-blue-500 text-ink'}
                                            `}
                                        >
                                            {item.label}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Money Columns */}
                            <div className="col-span-2 text-right font-mono text-stone-700">
                                {row.colIndex === 0 ? row.displayValue : ''}
                            </div>
                            <div className="col-span-2 text-right font-mono text-stone-700">
                                {row.colIndex === 1 ? row.displayValue : ''}
                            </div>
                            <div className="col-span-2 text-right font-mono text-stone-700">
                                {row.colIndex === 2 ? row.displayValue : ''}
                            </div>
                        </div>
                    );
                })}
                 <div className="grid grid-cols-12 gap-0 border-t-2 border-black mt-4 pt-1 font-bold">
                    <div className="col-span-6"></div>
                    <div className="col-span-2"></div>
                    <div className="col-span-2"></div>
                    <div className="col-span-2 border-t border-black border-double text-right"></div>
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
}

const LeaderboardView = ({ onBack }: { onBack: () => void }) => {
    const [scores, setScores] = useState<LeaderboardEntry[]>([]);

    useEffect(() => {
        getScores().then(setScores);
    }, []);

    return (
        <div className="min-h-screen bg-paper p-8 flex flex-col items-center">
            <div className="max-w-3xl w-full bg-white p-8 rounded shadow-lg border border-stone-200">
                <h2 className="text-3xl font-serif font-bold text-center mb-8 text-ink">Papan Skor</h2>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-stone-100 text-stone-600 text-sm uppercase">
                                <th className="p-3">#</th>
                                <th className="p-3">Nama</th>
                                <th className="p-3">Level</th>
                                <th className="p-3 text-center">Kesilapan</th>
                                <th className="p-3 text-right">Masa</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {scores.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-6 text-center text-stone-400">Belum ada rekod.</td>
                                </tr>
                            ) : (
                                scores.map((entry, idx) => (
                                    <tr key={idx} className={idx < 3 ? 'bg-yellow-50/50 font-medium' : ''}>
                                        <td className="p-3 text-stone-500">{idx + 1}</td>
                                        <td className="p-3">{entry.name}</td>
                                        <td className="p-3 text-xs text-stone-500">Level {entry.levelId}</td>
                                        <td className="p-3 text-center">
                                            <span className={`px-2 py-1 rounded text-xs ${entry.score === 0 ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>
                                                {entry.score}
                                            </span>
                                        </td>
                                        <td className="p-3 text-right font-mono">{formatTime(entry.time)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="mt-8 flex justify-center">
                    <Button onClick={onBack}>Kembali ke Menu</Button>
                </div>
            </div>
        </div>
    );
};
