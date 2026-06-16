process.env.NODE_ENV = "test";
process.env.CLIENT_ORIGIN = "http://localhost:3000";
process.env.DATABASE_URL = "postgresql://localhost:5432/flowchat_test";
process.env.JWT_ACCESS_SECRET = "test-access-secret-with-at-least-thirty-two-characters";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-with-at-least-thirty-two-characters";

