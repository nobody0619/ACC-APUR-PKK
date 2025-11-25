import { LevelConfig, DropZoneData } from './types';

export const APP_TITLE = "Perniagaan Hakim Berjaya";
export const GOOGLE_SCRIPT_URL = ""; 

// --- Helper Data Generators ---

const createItem = (label: string, category?: string) => ({ label, category, id: label });

// Level 1: Akaun Perdagangan
const LEVEL_1_ROWS: DropZoneData[] = [
  { id: 'l1-jualan', correctLabel: 'Jualan', displayValue: 'xx', indent: 0, colIndex: 2 },
  { id: 'l1-pulangan-jualan', correctLabel: 'Tolak Pulangan Jualan', displayValue: '(x)', indent: 1, colIndex: 2 },
  { id: 'l1-jualan-bersih', correctLabel: 'Jualan Bersih', displayValue: 'xx', indent: 0, colIndex: 2 },
  
  // Requirement: "Big title (-) Kos Jualan also to be an option" -> Not a header anymore
  { id: 'l1-header-kos', correctLabel: 'Tolak Kos Jualan', displayValue: '', indent: 0, colIndex: 0 }, // Draggable now
  
  { id: 'l1-inv-awal', correctLabel: 'Inventori Awal', displayValue: 'x', indent: 0, colIndex: 1 },
  { id: 'l1-belian', correctLabel: 'Belian', displayValue: 'x', indent: 0, colIndex: 0 },
  { id: 'l1-pulangan-belian', correctLabel: 'Tolak Pulangan Belian', displayValue: '(x)', indent: 1, colIndex: 0 },
  { id: 'l1-belian-bersih', correctLabel: 'Belian Bersih', displayValue: 'xx', indent: 0, colIndex: 0 },
  { id: 'l1-angkutan', correctLabel: 'Tambah Angkutan Masuk', displayValue: 'x', indent: 1, colIndex: 0 },
  
  { id: 'l1-kos-belian', correctLabel: 'Kos Belian', displayValue: 'xx', indent: 0, colIndex: 1 }, 
  { id: 'l1-kbud', correctLabel: 'Kos Barang untuk Dijual', displayValue: 'xx', indent: 0, colIndex: 1 },
  { id: 'l1-inv-akhir', correctLabel: 'Tolak Inventori Akhir', displayValue: '(x)', indent: 1, colIndex: 1 },
  { id: 'l1-kos-jualan', correctLabel: 'Kos Jualan', displayValue: '(xx)', indent: 0, colIndex: 2 },
  { id: 'l1-untung-kasar', correctLabel: 'Untung Kasar', displayValue: 'xx', indent: 0, colIndex: 2 },
];

const LEVEL_1_ITEMS = LEVEL_1_ROWS.filter(r => !r.isHeader && !r.isStatic).map(r => createItem(r.correctLabel!));


// Level 2: Akaun Untung Rugi
const LEVEL_2_ROWS: DropZoneData[] = [
  // Anchor
  { id: 'l2-start', correctLabel: 'Untung Kasar', displayValue: '11 030', indent: 0, colIndex: 2, isStatic: true },
  
  { id: 'l2-h-hasil', correctLabel: 'Tambah Hasil', displayValue: '', indent: 0, isHeader: true, colIndex: 0 },
  // Unordered Hasil Slots (2 items)
  { id: 'l2-h1', acceptsCategory: 'HASIL', displayValue: 'x', indent: 0, colIndex: 1 },
  { id: 'l2-h2', acceptsCategory: 'HASIL', displayValue: 'x', indent: 1, colIndex: 1 }, // sum line logic usually
  // The image shows first item in col 2? No, standard format: lists in col 1 (or 2), sum in col 2 (or 3).
  // Following image: Diskaun Diterima (75), Komisen (528) -> Sum (11633). 
  // Let's stick to simple layout.
  
  { id: 'l2-h-belanja', correctLabel: 'Tolak Belanja', displayValue: '', indent: 0, isHeader: true, colIndex: 0 },
  // Unordered Belanja Slots (7 items)
  { id: 'l2-b1', acceptsCategory: 'BELANJA', displayValue: 'x', indent: 0, colIndex: 1 },
  { id: 'l2-b2', acceptsCategory: 'BELANJA', displayValue: 'x', indent: 0, colIndex: 1 },
  { id: 'l2-b3', acceptsCategory: 'BELANJA', displayValue: 'x', indent: 0, colIndex: 1 },
  { id: 'l2-b4', acceptsCategory: 'BELANJA', displayValue: 'x', indent: 0, colIndex: 1 },
  { id: 'l2-b5', acceptsCategory: 'BELANJA', displayValue: 'x', indent: 0, colIndex: 1 },
  { id: 'l2-b6', acceptsCategory: 'BELANJA', displayValue: 'x', indent: 0, colIndex: 1 },
  { id: 'l2-b7', acceptsCategory: 'BELANJA', displayValue: 'x', indent: 0, colIndex: 1 },

  { id: 'l2-end', correctLabel: 'Untung Bersih', displayValue: 'xx', indent: 0, colIndex: 2, isStatic: true },
];

const LEVEL_2_ITEMS = [
  createItem('Diskaun Diterima', 'HASIL'),
  createItem('Komisen', 'HASIL'),
  createItem('Diskaun Diberi', 'BELANJA'),
  createItem('Promosi', 'BELANJA'),
  createItem('Sewa', 'BELANJA'),
  createItem('Insurans', 'BELANJA'),
  createItem('Gaji', 'BELANJA'),
  createItem('Belanja Am', 'BELANJA'),
  createItem('Alat Tulis', 'BELANJA'),
];

// Level 3: Gabungan (L1 + L2)
// Combines L1 items (Draggable) + L2 items (Draggable). L1 ends at Untung Kasar. L2 continues.
const LEVEL_3_ROWS: DropZoneData[] = [
    ...LEVEL_1_ROWS, // Ends with Untung Kasar (Draggable in L1 logic)
    // In L3, Untung Kasar is the bridge. Since it's in L1_ROWS as draggable, we keep it.
    
    // Resume L2 structure, removing the static start anchor
    ...LEVEL_2_ROWS.slice(1) // Remove 'Untung Kasar' static anchor from L2
];

const LEVEL_3_ITEMS = [...LEVEL_1_ITEMS, ...LEVEL_2_ITEMS];


// Level 4: Penyata Kedudukan Kewangan
const LEVEL_4_ROWS: DropZoneData[] = [
  { id: 'l4-h-abs', correctLabel: 'Aset Bukan Semasa', displayValue: '', indent: 0, isHeader: true, colIndex: 0 },
  { id: 'l4-abs-1', acceptsCategory: 'ABS', displayValue: 'x', indent: 0, colIndex: 2 },
  { id: 'l4-abs-2', acceptsCategory: 'ABS', displayValue: 'xx', indent: 0, colIndex: 2 },

  { id: 'l4-h-as', correctLabel: 'Aset Semasa', displayValue: '', indent: 0, isHeader: true, colIndex: 0 },
  { id: 'l4-as-1', acceptsCategory: 'AS', displayValue: 'x', indent: 0, colIndex: 1 },
  { id: 'l4-as-2', acceptsCategory: 'AS', displayValue: 'x', indent: 0, colIndex: 1 },
  { id: 'l4-as-3', acceptsCategory: 'AS', displayValue: 'x', indent: 0, colIndex: 1 },
  { id: 'l4-as-4', acceptsCategory: 'AS', displayValue: 'x', indent: 0, colIndex: 1 },
  
  { id: 'l4-h-ls', correctLabel: 'Tolak Liabiliti Semasa', displayValue: '', indent: 0, isHeader: true, colIndex: 0 },
  { id: 'l4-ls-1', acceptsCategory: 'LS', displayValue: '(xx)', indent: 0, colIndex: 1 },
  
  { id: 'l4-modal-kerja', correctLabel: 'Modal Kerja', displayValue: 'xx', indent: 0, colIndex: 2 },
  
  { id: 'l4-h-ep', correctLabel: 'Ekuiti Pemilik', displayValue: '', indent: 0, isHeader: true, colIndex: 0 },
  { id: 'l4-modal-awal', correctLabel: 'Modal Awal', displayValue: 'xx', indent: 0, colIndex: 2 },
  { id: 'l4-tambah-ub', correctLabel: 'Tambah Untung Bersih', displayValue: 'xx', indent: 0, colIndex: 2 },
  { id: 'l4-tolak-ambilan', correctLabel: 'Tolak Ambilan', displayValue: '(x)', indent: 0, colIndex: 2 },
  { id: 'l4-modal-akhir', correctLabel: 'Modal Akhir', displayValue: 'xx', indent: 0, colIndex: 2 },
  
  { id: 'l4-h-lbs', correctLabel: 'Liabiliti Bukan Semasa', displayValue: '', indent: 0, isHeader: true, colIndex: 0 },
  { id: 'l4-lbs-1', acceptsCategory: 'LBS', displayValue: 'xx', indent: 0, colIndex: 2 },
];

const LEVEL_4_ITEMS = [
  createItem('Alatan Pejabat', 'ABS'),
  createItem('Kenderaan', 'ABS'),
  
  createItem('Inventori Akhir', 'AS'),
  createItem('Akaun Belum Terima', 'AS'),
  createItem('Bank', 'AS'),
  createItem('Tunai', 'AS'),
  
  createItem('Akaun Belum Bayar', 'LS'),
  
  createItem('Modal Kerja'), // Specific
  createItem('Modal Awal'), // Specific
  createItem('Tambah Untung Bersih'), // Specific (Note: Text might vary, using standard)
  createItem('Tolak Ambilan'), // Specific
  createItem('Modal Akhir'), // Specific
  
  createItem('Pinjaman', 'LBS'),
];

export const LEVELS: Record<string, LevelConfig> = {
  '1': {
    id: '1',
    title: APP_TITLE,
    subTitle: 'Akaun Perdagangan bagi tahun berakhir 31 Mac 2016',
    rows: LEVEL_1_ROWS,
    items: LEVEL_1_ITEMS
  },
  '2': {
    id: '2',
    title: APP_TITLE,
    subTitle: 'Akaun Untung Rugi bagi tahun berakhir 31 Mac 2016',
    rows: LEVEL_2_ROWS,
    items: LEVEL_2_ITEMS
  },
  '3': {
    id: '3',
    title: APP_TITLE,
    subTitle: 'Akaun Perdagangan dan Untung Rugi bagi tahun berakhir 31 Mac 2016',
    rows: LEVEL_3_ROWS,
    items: LEVEL_3_ITEMS
  },
  '4': {
    id: '4',
    title: APP_TITLE,
    subTitle: 'Penyata Kedudukan Kewangan pada 31 Mac 2016',
    rows: LEVEL_4_ROWS,
    items: LEVEL_4_ITEMS
  }
};
