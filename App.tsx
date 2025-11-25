import React, { useState, useEffect } from 'react';
import { ScreenState, GameItem, LeaderboardEntry, LevelConfig, DropZoneData } from './types';
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
  const [placedItems, setPlacedItems] = useState<Record<string, GameItem[]>>({}); // Key: zoneId
  
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
      id: `item-${idx}-${def.id}-${Date.now()}`,
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

  // targetZoneId can be simple 'rowId' (for normal rows) or 'rowId-op' (for operator) or 'rowId-main' (for label)
  const handleDrop = (e: React.DragEvent, targetZoneFullId: string) => {
    e.preventDefault();
    const dataStr = e.dataTransfer.getData('application/json');
    if (!dataStr) return;

    const { item, source, sourceZoneId } = JSON.parse(dataStr) as { item: GameItem, source: 'bank' | 'zone', sourceZoneId?: string };
    
    const level = LEVELS[selectedLevelId];
    
    // Parse the target ID to find the Row Definition and Sub-Zone Type
    let rowId = targetZoneFullId;
    let subZone: 'main' | 'op' = 'main';

    if (targetZoneFullId.endsWith('-op')) {
      rowId = targetZoneFullId.replace('-op', '');
      subZone = 'op';
    } else if (targetZoneFullId.endsWith('-main')) {
      rowId = targetZoneFullId.replace('-main', '');
      subZone = 'main';
    }

    const rowDef = level.rows.find(r => r.id === rowId);
    if (!rowDef) return;

    // Check if occupied
    if (placedItems[targetZoneFullId]?.length > 0) {
        if (placedItems[targetZoneFullId][0].id === item.id) return;
        return; 
    }

    // --- Validation Logic ---
    let isCorrect = false;

    if (subZone === 'op') {
      // Validate Operator
      isCorrect = rowDef.hasOperator === true && rowDef.correctOperator === item.label; // Operator usually matches by Label (Tambah/Tolak)
    } else {
      // Validate Main Content
      const isExactMatch = rowDef.correctLabel === item.originalId;
      const isCategoryMatch = !!rowDef.acceptsCategory && rowDef.acceptsCategory === item.category;
      isCorrect = isExactMatch || isCategoryMatch;
    }

    if (isCorrect) {
        // --- CORRECT DROP ---
        
        // Remove from source
        if (source === 'bank') {
             // IMPORTANT: Only remove THIS specific item ID. 
             // Duplicate penalty items MUST REMAIN in the bank as clutter.
             setBankItems(prev => prev.filter(i => i.id !== item.id));
        } else if (source === 'zone' && sourceZoneId) {
            setPlacedItems(prev => ({
                ...prev,
                [sourceZoneId]: prev[sourceZoneId].filter(i => i.id !== item.id)
            }));
        }

        // Add to target
        setPlacedItems(prev => ({
            ...prev,
            [targetZoneFullId]: [item]
        }));
        
    } else {
        // --- INCORRECT DROP ---
        
        // Temporarily move item to target to show "Wrong" state
        if (source === 'bank') {
            setBankItems(prev => prev.filter(i => i.id !== item.id));
        } else if (sourceZoneId) {
            setPlacedItems(prev => ({
                ...prev,
                [sourceZoneId]: prev[sourceZoneId].filter(i => i.id !== item.id)
            }));
        }

        setPlacedItems(prev => ({
            ...prev,
            [targetZoneFullId]: [item]
        }));

        setIncorrectZoneId(targetZoneFullId);
        setMistakes(m => m + 1);

        // Penalty Logic
        setTimeout(() => {
            // Remove from the wrong zone
            setPlacedItems(prev => ({
                ...prev,
                [targetZoneFullId]: prev[targetZoneFullId].filter(i => i.id !== item.id)
            }));
            
            setIncorrectZoneId(null);

            // Add back to BANK with PENALTY duplicates
            const copy1: GameItem = { ...item, id: `${item.id}-copy1-${Date.now()}` };
            const copy2: GameItem = { ...item, id: `${item.id}-copy2-${Date.now()}` };
            
            // Add original + 2 copies
            setBankItems(prev => [...prev, item, copy1, copy2].sort(() => Math.random() - 0.5));

        }, 3000);
    }
  };

  // Check Win Condition
  useEffect(() => {
    if (currentScreen !== ScreenState.GAME) return;

    // Check if ALL required zones are filled.
    // Bank might NOT be empty because of penalty duplicates.
    const level = LEVELS[selectedLevelId];
    
    let allFilled = true;
    for (const row of level.rows) {
      if (row.isStatic) continue;
      
      // Check Main Zone (if it expects a value)
      // If row has correctLabel OR acceptsCategory, it needs a value.
      if ((row.correctLabel || row.acceptsCategory) && row.correctLabel !== '') {
         // Using row.id + suffix logic
         const mainZoneId = row.hasOperator ? `${row.id}-main` : row.id;
         if (!placedItems[mainZoneId] || placedItems[mainZoneId].length === 0) {
           allFilled = false;
           break;
         }
      }

      // Check Operator Zone
      if (row.hasOperator) {
         const opZoneId = `${row.id}-op`;
         if (!placedItems[opZoneId] || placedItems[opZoneId].length === 0) {
           allFilled = false;
           break;
         }
      }
    }

    const isWaitingForBounce = incorrectZoneId !== null;
    
    if (allFilled && !isWaitingForBounce) {
        setTimeout(() => {
             handleGameWin();
        }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placedItems, incorrectZoneId]);

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

  // --- COMPONENT HELPERS ---
  
  const renderDropZone = (
    zoneId: string, 
    placeholderHint: string, 
    isFilled: boolean, 
    isError: boolean,
    items: GameItem[],
    extraClasses: string = ""
  ) => (
    <div 
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, zoneId)}
        className={`
            relative rounded flex flex-wrap gap-1 items-center transition-colors duration-300 min-h-[2.2rem]
            ${!isFilled ? 'bg-stone-100 border border-dashed border-stone-300 hover:bg-stone-200' : ''}
            ${isError ? 'bg-red-100 border-red-400 ring-2 ring-red-400' : ''}
            ${isFilled ? '' : 'shadow-inner'}
            ${extraClasses}
        `}
    >
        {/* Removed text hint inside empty box as requested */}
        {items.map(item => (
            <div 
                key={item.id} 
                className={`
                    px-2 py-1 rounded shadow-sm text-sm font-medium w-full
                    ${isError ? 'bg-red-500 text-white' : 'bg-white border-l-4 border-blue-500 text-ink'}
                `}
            >
                {item.label}
            </div>
        ))}
    </div>
  );

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
      <div className="w-full md:w-64 bg-stone-800 text-stone-100 p-2 md:p-4 flex flex-col shadow-2xl z-20 shrink-0">
        <div className="mb-2 border-b border-stone-600 pb-2">
            <h2 className="text-sm md:text-lg font-bold text-blue-300">Bank Item</h2>
            <div className="mt-2 flex justify-between items-center bg-stone-900 p-2 rounded">
                <div className="text-center">
                    <span className="block text-[10px] text-stone-500">MASA</span>
                    <span className="font-mono text-sm md:text-xl">{formatTime(timer)}</span>
                </div>
                <div className="text-center">
                    <span className="block text-[10px] text-stone-500">KESILAPAN</span>
                    <span className="font-mono text-sm md:text-xl text-red-400">{mistakes}</span>
                </div>
            </div>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-1">
            <div className="flex flex-wrap gap-2 content-start">
                {bankItems.length === 0 && (
                    <div className="text-center text-stone-500 w-full py-4 italic text-xs">
                        Bank Kosong
                    </div>
                )}
                {bankItems.map((item) => (
                    <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item, 'bank')}
                        className="bg-white text-ink py-1 px-2 rounded shadow cursor-grab active:cursor-grabbing hover:bg-blue-50 text-xs font-medium border-l-2 border-blue-500 select-none animate-in fade-in zoom-in duration-200 max-w-full truncate"
                    >
                        {item.label}
                    </div>
                ))}
            </div>
        </div>
        <div className="mt-2 pt-2 border-t border-stone-600">
             <Button variant="secondary" className="w-full text-xs py-1" onClick={() => setCurrentScreen(ScreenState.MENU)}>Keluar</Button>
        </div>
      </div>

      {/* Main Area (Drop Zones) */}
      <div className="flex-1 overflow-y-auto p-2 md:p-8 flex justify-center bg-paper">
        <div className="bg-white w-full max-w-4xl shadow-lg border border-stone-300 p-3 md:p-12 relative min-h-max">
            {/* Paper Header */}
            <div className="text-center mb-4 md:mb-8">
                <h1 className="text-lg md:text-3xl font-serif font-bold uppercase tracking-wide text-ink mb-1 md:mb-2">{activeLevel.title}</h1>
                <h2 className="text-sm md:text-xl font-serif font-bold text-ink border-b-2 border-black pb-2 inline-block">{activeLevel.subTitle}</h2>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 gap-0 border-b-2 border-black mb-1 pb-1 font-bold text-xs md:text-base">
                <div className="col-span-6"></div>
                <div className="col-span-2 text-right">RM</div>
                <div className="col-span-2 text-right">RM</div>
                <div className="col-span-2 text-right">RM</div>
            </div>

            {/* Rows */}
            <div className="space-y-1 font-serif text-sm md:text-base leading-relaxed pb-20">
                {activeLevel.rows.map((row) => {
                    const rowId = row.id;

                    // 1. Static Rows (Purely visual text, e.g. "Untung Kasar" start of Level 2)
                    if (row.isStatic && row.correctLabel) {
                         return (
                            <div key={rowId} className="grid grid-cols-12 gap-1 items-center font-bold">
                                <div className="col-span-6 pr-4">{row.correctLabel}</div>
                                {renderMoneyCols(row)}
                            </div>
                        );
                    }
                    if (row.isStatic && !row.correctLabel) {
                        // Just a value row (sums)
                        return (
                             <div key={rowId} className="grid grid-cols-12 gap-1 items-center font-bold">
                                <div className="col-span-6 pr-4"></div>
                                {renderMoneyCols(row)}
                            </div>
                        )
                    }

                    // 2. Interactive Rows
                    const opZoneId = `${rowId}-op`;
                    const mainZoneId = row.hasOperator ? `${rowId}-main` : rowId; // If no operator, ID is original
                    
                    const opItems = placedItems[opZoneId] || [];
                    const mainItems = placedItems[mainZoneId] || [];
                    
                    const isOpError = incorrectZoneId === opZoneId;
                    const isMainError = incorrectZoneId === mainZoneId;

                    return (
                        <div key={rowId} className="grid grid-cols-12 gap-1 items-center min-h-[2.5rem]">
                            {/* Label Column (Split or Single) */}
                            <div className="col-span-6 pr-1 relative flex gap-1">
                                {row.hasOperator && (
                                    <div className="w-1/4 min-w-[60px]">
                                        {renderDropZone(opZoneId, '?', opItems.length > 0, isOpError, opItems, row.isHeaderRow ? "font-bold underline" : "")}
                                    </div>
                                )}
                                <div 
                                    className={`flex-1 relative transition-all duration-300`}
                                    style={{ marginLeft: (!row.hasOperator && row.indent) ? `${row.indent * 1.5}rem` : '0' }}
                                >
                                     {renderDropZone(mainZoneId, '', mainItems.length > 0, isMainError, mainItems, row.isHeaderRow ? "font-bold underline" : "")}
                                </div>
                            </div>

                            {/* Money Columns */}
                            {renderMoneyCols(row)}
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

const renderMoneyCols = (row: DropZoneData) => (
    <>
        <div className="col-span-2 text-right font-mono text-stone-700 text-xs md:text-base">
            {row.colIndex === 0 ? row.displayValue : ''}
        </div>
        <div className="col-span-2 text-right font-mono text-stone-700 text-xs md:text-base">
            {row.colIndex === 1 ? row.displayValue : ''}
        </div>
        <div className="col-span-2 text-right font-mono text-stone-700 text-xs md:text-base">
            {row.colIndex === 2 ? row.displayValue : ''}
        </div>
    </>
);

const LeaderboardView = ({ onBack }: { onBack: () => void }) => {
    const [scores, setScores] = useState<LeaderboardEntry[]>([]);

    useEffect(() => {
        getScores().then(setScores);
    }, []);

    return (
        <div className="min-h-screen bg-paper p-4 md:p-8 flex flex-col items-center">
            <div className="max-w-3xl w-full bg-white p-6 rounded shadow-lg border border-stone-200">
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-center mb-6 text-ink">Papan Skor</h2>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-stone-100 text-stone-600 text-xs md:text-sm uppercase">
                                <th className="p-3">#</th>
                                <th className="p-3">Nama</th>
                                <th className="p-3">Level</th>
                                <th className="p-3 text-center">Kesilapan</th>
                                <th className="p-3 text-right">Masa</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 text-sm md:text-base">
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