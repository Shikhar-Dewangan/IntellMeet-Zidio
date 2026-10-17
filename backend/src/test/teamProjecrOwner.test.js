// backend/tests/teamProjectOwner.test.js
import mongoose from "mongoose";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import jwt from "jsonwebtoken";

import app from "../app.js";  // adjust if entry is index.js/server.js
import User from "../models/user.model.js";
import Team from "../models/team.model.js";
import Project from "../models/project.model.js";
import TeamProjectOwner from "../models/teamProjectOwner.model.js";

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await User.deleteMany({});
  await Team.deleteMany({});
  await Project.deleteMany({});
  await TeamProjectOwner.deleteMany({});
});

async function makeUser(overrides = {}) {
  const user = await User.create({
    fullName: overrides.fullName || "Test User",
    email:
      overrides.email ||
      `u${Date.now()}${Math.random().toString(36).slice(2)}@test.com`,
    password: "password123",
    role: overrides.role || "member",
    isActive: true,
  });
  const token = jwt.sign(
    { _id: user._id, email: user.email },
    process.env.ACCESS_TOKEN_SECRET || "testsecret",
    { expiresIn: "1h" }
  );
  return { user, token };
}

const authCookie = (token) => [`accessToken=${token}`];

describe("TeamProjectOwner — Grant / Revoke / Isolation", () => {
  // ============================================================
  // GRANT
  // ============================================================
  test("team owner can grant TPO to a current member", async () => {
    const { user: owner, token: ownerToken } = await makeUser({
      email: "own1@t.com",
    });
    const { user: member } = await makeUser({ email: "mem1@t.com" });

    const team = await Team.create({
      name: "Alpha",
      owner: owner._id,
      members: [owner._id, member._id],
    });

    const res = await request(app)
      .post(`/api/v1/teams/${team._id}/project-owners`)
      .set("Cookie", authCookie(ownerToken))
      .send({ userId: member._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body.data.user._id).toBe(member._id.toString());

    const count = await TeamProjectOwner.countDocuments({ team: team._id });
    expect(count).toBe(1);
  });

  test("non-owner cannot grant TPO (403)", async () => {
    const { user: owner } = await makeUser({ email: "own2@t.com" });
    const { user: stranger, token: strangerToken } = await makeUser({
      email: "str2@t.com",
    });
    const { user: member } = await makeUser({ email: "mem2@t.com" });

    const team = await Team.create({
      name: "Alpha",
      owner: owner._id,
      members: [owner._id, member._id],
    });

    const res = await request(app)
      .post(`/api/v1/teams/${team._id}/project-owners`)
      .set("Cookie", authCookie(strangerToken))
      .send({ userId: member._id.toString() });

    expect(res.status).toBe(403);
  });

  test("cannot grant TPO to non-member (400)", async () => {
    const { user: owner, token: ownerToken } = await makeUser({
      email: "own3@t.com",
    });
    const { user: outsider } = await makeUser({ email: "out3@t.com" });

    const team = await Team.create({
      name: "Alpha",
      owner: owner._id,
      members: [owner._id],
    });

    const res = await request(app)
      .post(`/api/v1/teams/${team._id}/project-owners`)
      .set("Cookie", authCookie(ownerToken))
      .send({ userId: outsider._id.toString() });

    expect(res.status).toBe(400);
  });

  test("cannot grant TPO to team owner (400)", async () => {
    const { user: owner, token: ownerToken } = await makeUser({
      email: "own4@t.com",
    });
    const team = await Team.create({
      name: "Alpha",
      owner: owner._id,
      members: [owner._id],
    });

    const res = await request(app)
      .post(`/api/v1/teams/${team._id}/project-owners`)
      .set("Cookie", authCookie(ownerToken))
      .send({ userId: owner._id.toString() });

    expect(res.status).toBe(400);
  });

  test("duplicate grant returns 400", async () => {
    const { user: owner, token: ownerToken } = await makeUser({
      email: "own5@t.com",
    });
    const { user: member } = await makeUser({ email: "mem5@t.com" });

    const team = await Team.create({
      name: "Alpha",
      owner: owner._id,
      members: [owner._id, member._id],
    });

    await request(app)
      .post(`/api/v1/teams/${team._id}/project-owners`)
      .set("Cookie", authCookie(ownerToken))
      .send({ userId: member._id.toString() });

    const res = await request(app)
      .post(`/api/v1/teams/${team._id}/project-owners`)
      .set("Cookie", authCookie(ownerToken))
      .send({ userId: member._id.toString() });

    expect(res.status).toBe(400);
  });

  // ============================================================
  // REVOKE
  // ============================================================
  test("team owner can revoke TPO", async () => {
    const { user: owner, token: ownerToken } = await makeUser({
      email: "own6@t.com",
    });
    const { user: member } = await makeUser({ email: "mem6@t.com" });

    const team = await Team.create({
      name: "Alpha",
      owner: owner._id,
      members: [owner._id, member._id],
    });

    await TeamProjectOwner.create({
      team: team._id,
      user: member._id,
      grantedBy: owner._id,
    });

    const res = await request(app)
      .delete(`/api/v1/teams/${team._id}/project-owners/${member._id}`)
      .set("Cookie", authCookie(ownerToken));

    expect(res.status).toBe(200);

    const count = await TeamProjectOwner.countDocuments({ team: team._id });
    expect(count).toBe(0);
  });

  test("non-owner cannot revoke TPO (403)", async () => {
    const { user: owner } = await makeUser({ email: "own7@t.com" });
    const { user: member } = await makeUser({ email: "mem7@t.com" });
    const { token: strangerToken } = await makeUser({ email: "str7@t.com" });

    const team = await Team.create({
      name: "Alpha",
      owner: owner._id,
      members: [owner._id, member._id],
    });

    await TeamProjectOwner.create({
      team: team._id,
      user: member._id,
      grantedBy: owner._id,
    });

    const res = await request(app)
      .delete(`/api/v1/teams/${team._id}/project-owners/${member._id}`)
      .set("Cookie", authCookie(strangerToken));

    expect(res.status).toBe(403);
  });

  // ============================================================
  // AUTO-REVOKE ON MEMBER REMOVAL
  // ============================================================
  test("removing a member auto-revokes their TPO", async () => {
    const { user: owner, token: ownerToken } = await makeUser({
      email: "own8@t.com",
    });
    const { user: member } = await makeUser({ email: "mem8@t.com" });

    const team = await Team.create({
      name: "Alpha",
      owner: owner._id,
      members: [owner._id, member._id],
    });

    await TeamProjectOwner.create({
      team: team._id,
      user: member._id,
      grantedBy: owner._id,
    });

    await request(app)
      .delete(`/api/v1/teams/${team._id}/members/${member._id}`)
      .set("Cookie", authCookie(ownerToken));

    const count = await TeamProjectOwner.countDocuments({
      team: team._id,
      user: member._id,
    });
    expect(count).toBe(0);
  });

  // ============================================================
  // AUTO-REVOKE ON TEAM DELETE
  // ============================================================
  test("deleting a team removes its TPO records and pulls project refs", async () => {
    const { user: owner, token: ownerToken } = await makeUser({
      email: "own9@t.com",
    });
    const { user: member } = await makeUser({ email: "mem9@t.com" });

    const team = await Team.create({
      name: "Alpha",
      owner: owner._id,
      members: [owner._id, member._id],
    });

    await TeamProjectOwner.create({
      team: team._id,
      user: member._id,
      grantedBy: owner._id,
    });

    const project = await Project.create({
      name: "P1",
      owner: owner._id,
      members: [owner._id],
      teams: [team._id],
    });

    await request(app)
      .delete(`/api/v1/teams/${team._id}`)
      .set("Cookie", authCookie(ownerToken));

    const poCount = await TeamProjectOwner.countDocuments({ team: team._id });
    expect(poCount).toBe(0);

    const refreshedProject = await Project.findById(project._id);
    expect(refreshedProject.teams.map((t) => t.toString())).not.toContain(
      team._id.toString()
    );
  });

  // ============================================================
  // CROSS-TEAM ISOLATION
  // ============================================================
  test("TPO in Team A does not grant TPO in Team B", async () => {
    const { user: ownerA } = await makeUser({ email: "ownA@t.com" });
    const { user: ownerB } = await makeUser({ email: "ownB@t.com" });
    const { user: rahul } = await makeUser({ email: "rahul@t.com" });

    const teamA = await Team.create({
      name: "A",
      owner: ownerA._id,
      members: [ownerA._id, rahul._id],
    });
    const teamB = await Team.create({
      name: "B",
      owner: ownerB._id,
      members: [ownerB._id, rahul._id],
    });

    // Grant TPO only in Team A
    await TeamProjectOwner.create({
      team: teamA._id,
      user: rahul._id,
      grantedBy: ownerA._id,
    });

    // Rahul tries to create a project assigned to Team B → should fail
    const { token: rahulToken } = await makeUser({ email: "unused@t.com" });
    // Reuse Rahul's token
    const rahulJwt = jwt.sign(
      { _id: rahul._id, email: rahul.email },
      process.env.ACCESS_TOKEN_SECRET || "testsecret",
      { expiresIn: "1h" }
    );

    const res = await request(app)
      .post("/api/v1/projects")
      .set("Cookie", authCookie(rahulJwt))
      .send({ name: "Cross-team", teamIds: [teamB._id.toString()] });

    expect(res.status).toBe(403);
  });

  test("TPO in Team A allows creating project for Team A", async () => {
    const { user: ownerA } = await makeUser({ email: "own10@t.com" });
    const { user: rahul } = await makeUser({ email: "rahul10@t.com" });

    const teamA = await Team.create({
      name: "A",
      owner: ownerA._id,
      members: [ownerA._id, rahul._id],
    });

    await TeamProjectOwner.create({
      team: teamA._id,
      user: rahul._id,
      grantedBy: ownerA._id,
    });

    const rahulJwt = jwt.sign(
      { _id: rahul._id, email: rahul.email },
      process.env.ACCESS_TOKEN_SECRET || "testsecret",
      { expiresIn: "1h" }
    );

    const res = await request(app)
      .post("/api/v1/projects")
      .set("Cookie", authCookie(rahulJwt))
      .send({ name: "Own-team project", teamIds: [teamA._id.toString()] });

    expect(res.status).toBe(201);
  });

  test("stale TPO record after member removal does NOT grant access", async () => {
    const { user: ownerA } = await makeUser({ email: "own11@t.com" });
    const { user: rahul } = await makeUser({ email: "rahul11@t.com" });

    const teamA = await Team.create({
      name: "A",
      owner: ownerA._id,
      members: [ownerA._id, rahul._id],
    });

    // Simulate: TPO record exists but rahul is removed from members
    await TeamProjectOwner.create({
      team: teamA._id,
      user: rahul._id,
      grantedBy: ownerA._id,
    });
    teamA.members = teamA.members.filter(
      (m) => m.toString() !== rahul._id.toString()
    );
    await teamA.save();

    const rahulJwt = jwt.sign(
      { _id: rahul._id, email: rahul.email },
      process.env.ACCESS_TOKEN_SECRET || "testsecret",
      { expiresIn: "1h" }
    );

    const res = await request(app)
      .post("/api/v1/projects")
      .set("Cookie", authCookie(rahulJwt))
      .send({ name: "Stale", teamIds: [teamA._id.toString()] });

    expect(res.status).toBe(403);
  });
});