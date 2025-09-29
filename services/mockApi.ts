import { User, UserRole, Batch, BatchStatus, LabResult } from '../types';

// Helper to simulate network delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Mock Data
let MOCK_USERS: User[] = [
  { 
    id: 'farmer-1', 
    name: 'Ramesh Kumar', 
    phone: '9876543210', 
    role: UserRole.FARMER, 
    password: 'password123', 
    memberSince: '2023-09-15T00:00:00Z', 
    country: 'India',
    settings: { notifications: { sms: true, ivr: true }, language: 'English' }
  },
  { 
    id: 'farmer-2', 
    name: 'Sita Devi', 
    phone: '9876543211', 
    role: UserRole.FARMER, 
    password: 'password123', 
    memberSince: '2022-11-20T00:00:00Z', 
    country: 'India',
    settings: { notifications: { sms: true, ivr: false }, language: 'English' }
  },
];

let MOCK_BATCHES: Batch[] = [
    {
        id: 'B008',
        blockchainId: '0xstu901vwx234yza567',
        farmerId: 'farmer-1',
        plantName: 'Amla',
        confidence: 96.7,
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        location: { latitude: 25.4358, longitude: 81.8463 },
        address: 'Allahabad, Uttar Pradesh, India',
        status: BatchStatus.APPROVED,
        labResult: {
            fileName: 'lab_report_B008.pdf',
            uploadedAt: new Date().toISOString(),
            result: 'Pass',
        },
        earnings: 4800,
        qualityScore: 94.2,
        imageUrl: 'https://images.unsplash.com/photo-1596009249536-e0f6f4a86a3b?q=80&w=400',
        ivrData: { farmerName: 'Ramesh Kumar', plantType: 'Amla', quantity: '40 kg' },
    },
    {
        id: 'B009',
        blockchainId: '0xyza567bcd890efg123',
        farmerId: 'farmer-1',
        plantName: 'Moringa',
        confidence: 97.1,
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        location: { latitude: 13.0827, longitude: 80.2707 },
        address: 'Chennai, Tamil Nadu, India',
        status: BatchStatus.APPROVED,
        labResult: {
            fileName: 'lab_report_B009.pdf',
            uploadedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            result: 'Pass',
        },
        earnings: 5500,
        qualityScore: 95.8,
        imageUrl: 'https://images.unsplash.com/photo-1520106212299-d99c443e4568?q=80&w=400',
        ivrData: { farmerName: 'Ramesh Kumar', plantType: 'Moringa', quantity: '60 kg' },
    },
    {
        id: 'B001',
        blockchainId: '0x123abcdeffedcba321',
        farmerId: 'farmer-1',
        plantName: 'Ashwagandha',
        confidence: 98.2,
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
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
        timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        location: { latitude: 28.6139, longitude: 77.2090 },
        address: 'Connaught Place, New Delhi, Delhi, India',
        status: BatchStatus.APPROVED,
        labResult: {
            fileName: 'lab_report_B002.pdf',
            uploadedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            result: 'Pass',
        },
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
        timestamp: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        location: { latitude: 19.0760, longitude: 72.8777 },
        address: 'Santacruz East, Mumbai, Maharashtra, India',
        status: BatchStatus.PENDING,
        earnings: 3000,
        qualityScore: 88.9,
        imageUrl: 'https://images.unsplash.com/photo-1596009249536-e0f6f4a86a3b?q=80&w=400',
        ivrData: { farmerName: 'Ramesh Kumar', plantType: 'Brahmi', quantity: '20 kg' },
    },
    {
        id: 'B004',
        blockchainId: '0xabc123def456ghi789',
        farmerId: 'farmer-1',
        plantName: 'Turmeric',
        confidence: 97.8,
        timestamp: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
        location: { latitude: 18.5204, longitude: 73.8567 },
        address: 'Deccan Gymkhana, Pune, Maharashtra, India',
        status: BatchStatus.APPROVED,
        labResult: {
            fileName: 'lab_report_B004.pdf',
            uploadedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            result: 'Pass',
        },
        earnings: 4550,
        qualityScore: 93.5,
        imageUrl: 'https://images.unsplash.com/photo-1596009249536-e0f6f4a86a3b?q=80&w=400',
        ivrData: { farmerName: 'Ramesh Kumar', plantType: 'Turmeric', quantity: '30 kg' },
    },
    {
        id: 'B005',
        blockchainId: '0xdef456ghi789jkl012',
        farmerId: 'farmer-1',
        plantName: 'Neem',
        confidence: 96.3,
        timestamp: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        location: { latitude: 26.9124, longitude: 75.7873 },
        address: 'C Scheme, Jaipur, Rajasthan, India',
        status: BatchStatus.APPROVED,
        labResult: {
            fileName: 'lab_report_B005.pdf',
            uploadedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
            result: 'Pass',
        },
        earnings: 3800,
        qualityScore: 90.1,
        imageUrl: 'https://images.unsplash.com/photo-1596009249536-e0f6f4a86a3b?q=80&w=400',
        ivrData: { farmerName: 'Ramesh Kumar', plantType: 'Neem', quantity: '45 kg' },
    },
    {
        id: 'B006',
        blockchainId: '0xjkl012mno345pqr678',
        farmerId: 'farmer-1',
        plantName: 'Shatavari',
        confidence: 97.5,
        timestamp: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
        location: { latitude: 10.8505, longitude: 76.2711 },
        address: 'Thrissur, Kerala, India',
        status: BatchStatus.APPROVED,
        labResult: {
            fileName: 'lab_report_B006.pdf',
            uploadedAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString(),
            result: 'Pass',
        },
        earnings: 6200,
        qualityScore: 96.8,
        imageUrl: 'https://images.unsplash.com/photo-1520106212299-d99c443e4568?q=80&w=400',
        ivrData: { farmerName: 'Ramesh Kumar', plantType: 'Shatavari', quantity: '50 kg' },
    },
    {
        id: 'B007',
        blockchainId: '0xpqr678stu901vwx234',
        farmerId: 'farmer-1',
        plantName: 'Giloy',
        confidence: 94.8,
        timestamp: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
        location: { latitude: 30.0668, longitude: 79.0193 },
        address: 'Rudraprayag, Uttarakhand, India',
        status: BatchStatus.APPROVED,
        labResult: {
            fileName: 'lab_report_B007.pdf',
            uploadedAt: new Date(Date.now() - 44 * 24 * 60 * 60 * 1000).toISOString(),
            result: 'Pass',
        },
        earnings: 4100,
        qualityScore: 92.3,
        imageUrl: 'https://images.unsplash.com/photo-1620786384240-27e1d1337626?q=80&w=400',
        ivrData: { farmerName: 'Ramesh Kumar', plantType: 'Giloy', quantity: '35 kg' },
    },
];

// In-memory unique ID generator
let nextBatchId = 10;
// In-memory OTP store (for simulation)
const otpStore: Record<string, { otp: string, expires: number }> = {};

// SHA-256 for Blockchain ID simulation
async function digestMessage(message: string) {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `0x${hashHex}`;
}

export const api = {
  async authenticate(phone: string, pass: string): Promise<User | null> {
    await delay(500);
    const user = MOCK_USERS.find(u => u.phone === phone && u.password === pass);
    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return null;
  },
  
  async sendOtp(phone: string): Promise<{ success: boolean; message: string }> {
    await delay(600);
    const user = MOCK_USERS.find(u => u.phone === phone);
    if (!user) {
        throw new Error("No user found with this phone number.");
    }
    const otp = '123456'; // Hardcoded for simulation
    otpStore[phone] = { otp, expires: Date.now() + 5 * 60 * 1000 }; // 5-minute expiry
    console.log(`OTP for ${phone}: ${otp}`); // Simulate sending OTP
    return { success: true, message: 'OTP sent successfully.' };
  },

  async verifyOtp(phone: string, otp: string): Promise<User | null> {
    await delay(500);
    const stored = otpStore[phone];
    if (stored && stored.otp === otp && stored.expires > Date.now()) {
        delete otpStore[phone]; // OTP is single-use
        const user = MOCK_USERS.find(u => u.phone === phone);
        if (user) {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        }
    }
    throw new Error("Invalid or expired OTP.");
  },

  async authenticateWithGoogle(): Promise<User | null> {
    await delay(700);
    const googleUserId = 'google-farmer-1';
    let googleUser = MOCK_USERS.find(u => u.id === googleUserId);

    if (!googleUser) {
        googleUser = {
            id: googleUserId,
            name: 'Aisha Patel (Google)',
            phone: '9999999999', // Dummy phone for Google users
            role: UserRole.FARMER,
            memberSince: new Date().toISOString(),
            country: 'India',
            settings: { notifications: { sms: true, ivr: true }, language: 'English' }
        };
        MOCK_USERS.push(googleUser);
    }
    return googleUser;
  },

  async register(name: string, phone: string, pass: string): Promise<User | null> {
    await delay(500);
    const existingUser = MOCK_USERS.find(u => u.phone === phone);
    if (existingUser) {
      throw new Error("This phone number is already registered.");
    }
    const newUser: User = {
      id: `farmer-${MOCK_USERS.length + 1}`,
      name,
      phone,
      role: UserRole.FARMER,
      password: pass,
      memberSince: new Date().toISOString(),
      country: 'India',
      settings: { notifications: { sms: true, ivr: true }, language: 'English' }
    };
    MOCK_USERS.push(newUser);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  },

  async updateUser(userId: string, data: Partial<User>): Promise<User> {
    await delay(400);
    const userIndex = MOCK_USERS.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      throw new Error("User not found");
    }
    MOCK_USERS[userIndex] = { ...MOCK_USERS[userIndex], ...data };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = MOCK_USERS[userIndex];
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
    // Simulate API call and hardcode the response for prototype purposes.
    await delay(1500); 
    return {
      plantName: 'Ashwagandha',
      confidence: 98.7,
    };
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