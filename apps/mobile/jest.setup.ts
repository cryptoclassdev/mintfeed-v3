/* Mock modules that rely on native code or side-effects */

// AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

// expo-haptics
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
  NotificationFeedbackType: { Success: "success", Warning: "warning", Error: "error" },
}));

// expo-router
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  Link: "Link",
}));

// @solana/web3.js (avoid ESM parsing errors in nested deps)
jest.mock("@solana/web3.js", () => ({
  VersionedTransaction: {
    deserialize: jest.fn(),
  },
  Connection: jest.fn(),
  PublicKey: jest.fn((key: string) => ({ toString: () => key, toBase58: () => key })),
  clusterApiUrl: jest.fn(() => "https://api.mainnet-beta.solana.com"),
  SystemProgram: { transfer: jest.fn() },
  LAMPORTS_PER_SOL: 1_000_000_000,
}));

// wallet-ui SDK
jest.mock("@wallet-ui/react-native-web3js", () => ({
  useMobileWallet: jest.fn(() => ({
    account: undefined,
    connect: jest.fn(),
    disconnect: jest.fn(),
    signTransaction: jest.fn(),
    signAndSendTransaction: jest.fn(),
    signMessage: jest.fn(),
    connection: {},
  })),
  MobileWalletProvider: ({ children }: { children: React.ReactNode }) => children,
  toUint8Array: jest.fn(),
  fromUint8Array: jest.fn(),
}));

// api-client
jest.mock("@/lib/api-client", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));
