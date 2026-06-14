import request from "supertest";
import { createApp } from "../src/app.js";

describe("health route", () => {
  it("returns service health", async () => {
    const response = await request(createApp()).get("/api/health").expect(200);

    expect(response.body.status).toBe("ok");
    expect(response.body.service).toBe("flowchat-backend");
  });
});

