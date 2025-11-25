import { LevelConfig, DropZoneData } from './types';

export const APP_TITLE = "Perniagaan Hakim Berjaya";
export const GOOGLE_SCRIPT_URL = ""; 

// --- Helper Data Generators ---

const createItem = (label: string, category?: string) => ({ label, category, id: label });

// Common Operators
const OP_TAMBAH = createItem('Tambah');
const OP_TOLAK = createItem('Tolak');

// Level 1: Akaun Perdagangan
const LEVEL_1_ROWS: DropZoneData[] = [
  { id: 'l1-jualan', correctLabel: 'Jualan', displayValue: '28 000', indent: 0, colIndex: 2 },
  { id: 'l1-pulangan-jualan', hasOperator: true, correctOperator: 'Tolak', correctLabel: 'Pulangan Jualan', displayValue: '(190)', indent: 0, colIndex: 2 }, // Indent 0 for cleaner align with operator
  { id: 'l1-jualan-bersih', correctLabel: 'Jualan Bersih', displayValue: '27 810', indent: 0, colIndex: 2 },
  
  // "(-) Kos Jualan" split into two draggable items
  { id: 'l1-header-kos', hasOperator: true, correctOperator: 'Tolak', correctLabel: 'Kos Jualan', isHeaderRow: true, displayValue: '', indent: 0, colIndex: 0 }, 
  
  { id: 'l1-inv-awal', correctLabel: 'Inventori Awal', displayValue: '1 600', indent: 0, colIndex: 1 },
  { id: 'l1-belian', correctLabel: 'Belian', displayValue: '18 000', indent: 0, colIndex: 0 },
  { id: 'l1-pulangan-belian', hasOperator: true, correctOperator: 'Tolak', correctLabel: 'Pulangan Belian', displayValue: '(140)', indent: 0, colIndex: 0 },
  { id: 'l1-belian-bersih', correctLabel: 'Belian Bersih', displayValue: '17 860', indent: 0, colIndex: 0 },
  { id: 'l1-angkutan', hasOperator: true, correctOperator: 'Tambah', correctLabel: 'Angkutan Masuk', displayValue: '120', indent: 0, colIndex: 0 },
  
  { id: 'l1-kos-belian', correctLabel: 'Kos Belian', displayValue: '17 980', indent: 0, colIndex: 1 }, 
  { id: 'l1-kbud', correctLabel: 'Kos Barang untuk Dijual', displayValue: '19 580', indent: 0, colIndex: 1 },
  { id: 'l1-inv-akhir', hasOperator: true, correctOperator: 'Tolak', correctLabel: 'Inventori Akhir', displayValue: '(2 800)', indent: 0, colIndex: 1 },
  { id: 'l1-kos-jualan', correctLabel: 'Kos Jualan', displayValue: '(16 780)', indent: 0, colIndex: 2 },
  { id: 'l1-untung-kasar', correctLabel: 'Untung Kasar', displayValue: '11 030', indent: 0, colIndex: 2 },
];

const LEVEL_1_ITEMS = [
    createItem('Jualan'),
    createItem('Pulangan Jualan'),
    createItem('Jualan Bersih'),
    createItem('Kos Jualan'), // For the header
    createItem('Kos Jualan'), // For the calculated line
    createItem('Inventori Awal'),
    createItem('Belian'),
    createItem('Pulangan Belian'),
    createItem('Belian Bersih'),
    createItem('Angkutan Masuk'),
    createItem('Kos Belian'),
    createItem('Kos Barang untuk Dijual'),
    createItem('Inventori Akhir'),
    createItem('Untung Kasar'),
    // Operators needed: Tolak (4), Tambah (1)
    OP_TOLAK, OP_TOLAK, OP_TOLAK, OP_TOLAK,
    OP_TAMBAH
];


// Level 2: Akaun Untung Rugi
const LEVEL_2_ROWS: DropZoneData[] = [
  // Anchor
  { id: 'l2-start', correctLabel: 'Untung Kasar', displayValue: '11 030', indent: 0, colIndex: 2, isStatic: true },
  
  // Draggable Header: Tambah Hasil
  { id: 'l2-h-hasil', hasOperator: true, correctOperator: 'Tambah', correctLabel: 'Hasil', displayValue: '', indent: 0, isHeaderRow: true, colIndex: 0 },
  
  // Unordered Hasil Slots (2 items)
  { id: 'l2-h1', acceptsCategory: 'HASIL', displayValue: '75', indent: 0, colIndex: 1 },
  { id: 'l2-h2', acceptsCategory: 'HASIL', displayValue: '528', indent: 0, colIndex: 1 }, // Indent fixed to 0
  
  // Sum of Hasil (Static visual or skipped? Image shows sum line. Let's add a static sum line for clarity)
  { id: 'l2-h-sum', correctLabel: '', displayValue: '11 633', indent: 0, isStatic: true, colIndex: 2 }, // Empty label, just value

  // Draggable Header: Tolak Belanja
  { id: 'l2-h-belanja', hasOperator: true, correctOperator: 'Tolak', correctLabel: 'Belanja', displayValue: '', indent: 0, isHeaderRow: true, colIndex: 0 },
  
  // Unordered Belanja Slots (7 items)
  { id: 'l2-b1', acceptsCategory: 'BELANJA', displayValue: '60', indent: 0, colIndex: 1 },
  { id: 'l2-b2', acceptsCategory: 'BELANJA', displayValue: '350', indent: 0, colIndex: 1 },
  { id: 'l2-b3', acceptsCategory: 'BELANJA', displayValue: '1 250', indent: 0, colIndex: 1 },
  { id: 'l2-b4', acceptsCategory: 'BELANJA', displayValue: '370', indent: 0, colIndex: 1 },
  { id: 'l2-b5', acceptsCategory: 'BELANJA', displayValue: '3 500', indent: 0, colIndex: 1 },
  { id: 'l2-b6', acceptsCategory: 'BELANJA', displayValue: '123', indent: 0, colIndex: 1 },
  { id: 'l2-b7', acceptsCategory: 'BELANJA', displayValue: '240', indent: 0, colIndex: 1 },

  { id: 'l2-b-sum', correctLabel: '', displayValue: '(5 893)', indent: 0, isStatic: true, colIndex: 2 }, // Empty label, just value

  { id: 'l2-end', correctLabel: 'Untung Bersih', displayValue: '5 740', indent: 0, colIndex: 2, isStatic: true },
];

const LEVEL_2_ITEMS = [
  OP_TAMBAH,
  createItem('Hasil'),
  createItem('Diskaun Diterima', 'HASIL'),
  createItem('Komisen', 'HASIL'),
  
  OP_TOLAK,
  createItem('Belanja'),
  createItem('Diskaun Diberi', 'BELANJA'),
  createItem('Promosi', 'BELANJA'),
  createItem('Sewa', 'BELANJA'),
  createItem('Insurans', 'BELANJA'),
  createItem('Gaji', 'BELANJA'),
  createItem('Belanja Am', 'BELANJA'),
  createItem('Alat Tulis', 'BELANJA'),
];

// Level 3: Gabungan (L1 + L2)
const LEVEL_3_ROWS: DropZoneData[] = [
    ...LEVEL_1_ROWS, // Ends with Untung Kasar (Draggable in L1 logic)
    // Remove the static 'Untung Kasar' from L2_ROWS start, and use the rest
    ...LEVEL_2_ROWS.slice(1) 
];

const LEVEL_3_ITEMS = [...LEVEL_1_ITEMS, ...LEVEL_2_ITEMS];


// Level 4: Penyata Kedudukan Kewangan
const LEVEL_4_ROWS: DropZoneData[] = [
  { id: 'l4-h-abs', correctLabel: 'Aset Bukan Semasa', displayValue: '', indent: 0, isHeaderRow: true, colIndex: 0 },
  { id: 'l4-abs-1', acceptsCategory: 'ABS', displayValue: '790', indent: 0, colIndex: 2 },
  { id: 'l4-abs-2', acceptsCategory: 'ABS', displayValue: '20 000', indent: 0, colIndex: 2 },
  { id: 'l4-abs-sum', correctLabel: '', displayValue: '20 790', indent: 0, isStatic: true, colIndex: 2 },

  { id: 'l4-h-as', correctLabel: 'Aset Semasa', displayValue: '', indent: 0, isHeaderRow: true, colIndex: 0 },
  { id: 'l4-as-1', acceptsCategory: 'AS', displayValue: '2 800', indent: 0, colIndex: 1 },
  { id: 'l4-as-2', acceptsCategory: 'AS', displayValue: '7 200', indent: 0, colIndex: 1 },
  { id: 'l4-as-3', acceptsCategory: 'AS', displayValue: '8 000', indent: 0, colIndex: 1 },
  { id: 'l4-as-4', acceptsCategory: 'AS', displayValue: '450', indent: 0, colIndex: 1 },
  { id: 'l4-as-sum', correctLabel: '', displayValue: '18 450', indent: 0, isStatic: true, colIndex: 1 },
  
  { id: 'l4-h-ls', hasOperator: true, correctOperator: 'Tolak', correctLabel: 'Liabiliti Semasa', displayValue: '', indent: 0, isHeaderRow: true, colIndex: 0 },
  { id: 'l4-ls-1', acceptsCategory: 'LS', displayValue: '(13 000)', indent: 0, colIndex: 1 },
  
  { id: 'l4-modal-kerja', correctLabel: 'Modal Kerja', displayValue: '5 450', indent: 0, colIndex: 2 },
  { id: 'l4-mk-sum', correctLabel: '', displayValue: '26 240', indent: 0, isStatic: true, colIndex: 2 },
  
  { id: 'l4-h-ep', correctLabel: 'Ekuiti Pemilik', displayValue: '', indent: 0, isHeaderRow: true, colIndex: 0 },
  { id: 'l4-modal-awal', correctLabel: 'Modal Awal', displayValue: '15 000', indent: 0, colIndex: 2 },
  { id: 'l4-tambah-ub', hasOperator: true, correctOperator: 'Tambah', correctLabel: 'Untung Bersih', displayValue: '5 740', indent: 0, colIndex: 2 },
  { id: 'l4-ub-sum', correctLabel: '', displayValue: '20 740', indent: 0, isStatic: true, colIndex: 2 },
  { id: 'l4-tolak-ambilan', hasOperator: true, correctOperator: 'Tolak', correctLabel: 'Ambilan', displayValue: '(500)', indent: 0, colIndex: 2 },
  { id: 'l4-modal-akhir', correctLabel: 'Modal Akhir', displayValue: '20 240', indent: 0, colIndex: 2 },
  
  { id: 'l4-h-lbs', correctLabel: 'Liabiliti Bukan Semasa', displayValue: '', indent: 0, isHeaderRow: true, colIndex: 0 },
  { id: 'l4-lbs-1', acceptsCategory: 'LBS', displayValue: '6 000', indent: 0, colIndex: 2 },
  { id: 'l4-final-sum', correctLabel: '', displayValue: '26 240', indent: 0, isStatic: true, colIndex: 2 },
];

const LEVEL_4_ITEMS = [
  createItem('Aset Bukan Semasa'),
  createItem('Alatan Pejabat', 'ABS'),
  createItem('Kenderaan', 'ABS'),
  
  createItem('Aset Semasa'),
  createItem('Inventori Akhir', 'AS'),
  createItem('Akaun Belum Terima', 'AS'),
  createItem('Bank', 'AS'),
  createItem('Tunai', 'AS'),
  
  OP_TOLAK,
  createItem('Liabiliti Semasa'),
  createItem('Akaun Belum Bayar', 'LS'),
  
  createItem('Modal Kerja'),
  createItem('Ekuiti Pemilik'),
  createItem('Modal Awal'),
  
  OP_TAMBAH,
  createItem('Untung Bersih'),
  
  OP_TOLAK,
  createItem('Ambilan'),
  
  createItem('Modal Akhir'),
  
  createItem('Liabiliti Bukan Semasa'),
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