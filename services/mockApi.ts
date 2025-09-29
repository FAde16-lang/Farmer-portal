import { User, UserRole, Batch, BatchStatus, LabResult } from '../types';

// Helper to simulate network delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Mock Data
let MOCK_USERS: User[] = [
  { id: 'farmer-1', name: 'Ramesh Kumar', role: UserRole.FARMER, password: 'password123', memberSince: '2023-09-15T00:00:00Z', country: 'India' },
  { id: 'farmer-2', name: 'Sita Devi', role: UserRole.FARMER, password: 'password123', memberSince: '2022-11-20T00:00:00Z', country: 'India' },
];

let MOCK_BATCHES: Batch[] = [
    {
        id: 'B001',
        blockchainId: '0x123abcdeffedcba321',
        farmerId: 'farmer-1',
        plantName: 'Ashwagandha',
        confidence: 98.2,
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        location: { latitude: 28.6139, longitude: 77.2090 },
        address: 'Connaught Place, New Delhi, Delhi, India',
        status: BatchStatus.APPROVED,
        labResult: {
            fileName: 'lab_report_B001.pdf',
            uploadedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            result: 'Pass',
        },
        earnings: 5100,
        qualityScore: 95.0,
        imageUrl: 'https://images.unsplash.com/photo-1620786384240-27e1d1337626?q=80&w=400',
        ivrData: { farmerName: 'Ramesh Kumar', plantType: 'Ashwagandha', quantity: '25.5 kg' },
    },
    {
        id: 'B002',
        blockchainId: '0x456fghijkkjihgf654',
        farmerId: 'farmer-1',
        plantName: 'Tulsi',
        confidence: 95.5,
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        location: { latitude: 28.6139, longitude: 77.2090 },
        address: 'Connaught Place, New Delhi, Delhi, India',
        status: BatchStatus.APPROVED,
        earnings: 3200,
        qualityScore: 91.2,
        imageUrl: 'https://images.unsplash.com/photo-1621511414129-2703db444883?q=80&w=400',
        ivrData: { farmerName: 'Ramesh Kumar', plantType: 'Tulsi', quantity: '15 kg' },
    },
    {
        id: 'B003',
        blockchainId: '0x789lmnopqrponml987',
        farmerId: 'farmer-1',
        plantName: 'Brahmi',
        confidence: 99.1,
        timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        location: { latitude: 19.0760, longitude: 72.8777 },
        address: 'Santacruz East, Mumbai, Maharashtra, India',
        status: BatchStatus.PENDING,
        earnings: 3000,
        qualityScore: 88.9,
        imageUrl: 'https://images.unsplash.com/photo-1596009249536-e0f6f4a86a3b?q=80&w=400',
        ivrData: { farmerName: 'Ramesh Kumar', plantType: 'Brahmi', quantity: '20 kg' },
    },
];


// In-memory unique ID generator
let nextBatchId = 5;

// SHA-256 for Blockchain ID simulation
async function digestMessage(message: string) {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `0x${hashHex}`;
}


export const api = {
  async authenticate(farmerId: string, pass: string): Promise<User | null> {
    await delay(500);
    const user = MOCK_USERS.find(u => u.id.toLowerCase() === farmerId.toLowerCase() && u.password === pass);
    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return null;
  },

  async authenticateWithGoogle(): Promise<User | null> {
    await delay(700);
    const googleUserId = 'google-farmer-1';
    let googleUser = MOCK_USERS.find(u => u.id === googleUserId);

    if (!googleUser) {
        googleUser = {
            id: googleUserId,
            name: 'Aisha Patel (Google)',
            role: UserRole.FARMER,
            memberSince: new Date().toISOString(),
            country: 'India',
        };
        MOCK_USERS.push(googleUser);
    }
    return googleUser;
  },

  async register(name: string, farmerId: string, pass: string): Promise<User | null> {
    await delay(500);
    const existingUser = MOCK_USERS.find(u => u.id.toLowerCase() === farmerId.toLowerCase());
    if (existingUser) {
      throw new Error("Farmer ID already exists.");
    }
    const newUser: User = {
      id: farmerId,
      name,
      role: UserRole.FARMER,
      password: pass,
      memberSince: new Date().toISOString(),
      country: 'India',
    };
    MOCK_USERS.push(newUser);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  },

  async getBatchesByFarmer(farmerId: string): Promise<Batch[]> {
    await delay(800);
    return JSON.parse(JSON.stringify(MOCK_BATCHES.filter(b => b.farmerId === farmerId)));
  },

  async getAllBatches(): Promise<Batch[]> {
    await delay(800);
    return JSON.parse(JSON.stringify(MOCK_BATCHES));
  },
  
  async recognizePlant(file: File): Promise<{ plantName: string, confidence: number }> {
    await delay(1500);
    // This is where you would integrate a real AI model.
    // For now, we simulate a response.
    const plantNames = ['Ashwagandha', 'Tulsi', 'Brahmi', 'Amla', 'Neem'];
    const randomPlant = plantNames[Math.floor(Math.random() * plantNames.length)];
    const randomConfidence = Math.random() * (99.9 - 90) + 90;
    return { plantName: randomPlant, confidence: randomConfidence };
  },
  
  async submitBatch(data: Omit<Batch, 'id' | 'blockchainId' | 'status' | 'earnings' | 'qualityScore' | 'imageUrl'>): Promise<Batch> {
    await delay(1000);
    const blockchainId = await digestMessage(JSON.stringify(data) + Date.now());
    const newBatch: Batch = {
      ...data,
      id: `B${String(nextBatchId++).padStart(3, '0')}`,
      blockchainId,
      status: BatchStatus.PENDING,
      earnings: Math.floor(Math.random() * 5000) + 1000,
      qualityScore: Math.random() * (98.0 - 85.0) + 85.0,
      imageUrl: 'https://images.unsplash.com/photo-1520106212299-d99c443e4568?q=80&w=400',
    };
    MOCK_BATCHES.push(newBatch);
    return newBatch;
  },

  async updateBatchStatus(batchId: string, status: BatchStatus, labResult?: LabResult): Promise<Batch> {
      await delay(500);
      const batchIndex = MOCK_BATCHES.findIndex(b => b.id === batchId);
      if (batchIndex === -1) {
          throw new Error("Batch not found");
      }
      MOCK_BATCHES[batchIndex].status = status;
      if (labResult) {
          MOCK_BATCHES[batchIndex].labResult = labResult;
      }
      return MOCK_BATCHES[batchIndex];
  }
};