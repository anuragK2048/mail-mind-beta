import request from "supertest";

// --- Step 1: Define Mocks ---

const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
  order: jest.fn().mockReturnThis(),
};

// --- Step 2: Mock Modules BEFORE App Import ---

jest.doMock("../../src/database/supabase", () => ({
  supabase: mockSupabase,
}));

jest.doMock("../../src/config/redis", () => ({
  // The key here MUST match the named export your app uses.
  connectToRedis: jest.fn().mockResolvedValue(undefined), // <-- FIX IS HERE

  // These can stay the same, assuming they are also exported
  redisStore: jest.fn(),
  redisClient: {
    on: jest.fn(),
    connect: jest.fn().mockResolvedValue(undefined),
    quit: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock("../../src/middleware/isAuthenticated", () => ({
  isAuthenticated: (req, res, next) => {
    req.session = { userId: "mock-user-id-123" } as any;
    next();
  },
}));

// --- Step 3: Import App AFTER mocks are defined ---
const app = require("../../src/app").default;
const { redisClient } = require("../../src/config/redis"); // Get reference to mocked client for shutdown

// --- Step 4: Add Teardown Logic ---
// Ensure any potential open handles are closed after tests
afterAll(async () => {
  // Although mocked, it's good practice to show how you'd close real connections
  if (redisClient && redisClient.quit) {
    await redisClient.quit();
  }
});

// --- Step 5: Your Tests (can remain the same) ---
describe("Label Routes - /api/v1/labels", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test suite for POST /api/v1/labels (Create)
  describe("POST /", () => {
    it("should create a new label and return 201", async () => {
      const newLabelPayload = { name: "Urgent", color: "#ff0000" };
      const mockDbResponse = { ...newLabelPayload, id: "mock-label-uuid-1" };
      mockSupabase.single.mockResolvedValueOnce({
        data: mockDbResponse,
        error: null,
      });

      const res = await request(app)
        .post("/api/v1/labels")
        .send(newLabelPayload);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toEqual(mockDbResponse);
    });

    // ... your other tests for POST ...
    it("should fail with a validation error for missing name", async () => {
      // ...
    });
  });

  // ... your tests for GET, PUT, DELETE ...
  describe("GET /", () => {
    it("should return a list of labels for the user and return 200", async () => {
      const mockLabelsList = [
        { id: "mock-label-uuid-1", name: "Urgent", color: "#ff0000" },
        { id: "mock-label-uuid-2", name: "ProjectX", color: "#00ff00" },
      ];
      mockSupabase.select.mockResolvedValueOnce({
        data: mockLabelsList,
        error: null,
      });

      const res = await request(app).get("/api/v1/labels");

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(mockLabelsList);
    });
  });
});
