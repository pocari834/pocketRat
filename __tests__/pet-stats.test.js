/**
 * PetStats unit tests
 */
const path = require("path");
const fs = require("fs");

const petStatsCode = fs.readFileSync(path.join(__dirname, "..", "renderer", "js", "pet-stats.js"), "utf8");
const PetStats = (new Function(petStatsCode + "; return PetStats;"))();

describe("PetStats", () => {
  let stats;

  beforeEach(() => {
    stats = new PetStats();
  });

  test("initializes with all stats at 100", () => {
    expect(stats.hunger).toBe(100);
    expect(stats.mood).toBe(100);
    expect(stats.energy).toBe(100);
  });

  test("decays stats over time", () => {
    stats.update(10000, "idle");
    expect(stats.hunger).toBeLessThan(100);
    expect(stats.mood).toBeLessThan(100);
    expect(stats.energy).toBeLessThan(100);
  });

  test("energy recovers during sleep", () => {
    stats.energy = 50;
    stats.update(10000, "sleep");
    expect(stats.energy).toBeGreaterThan(50);
  });

  test("energy decays when not sleeping", () => {
    stats.energy = 50;
    stats.update(10000, "walk");
    expect(stats.energy).toBeLessThan(50);
  });

  test("stats do not go below 0", () => {
    stats.hunger = 0;
    stats.update(100000, "idle");
    expect(stats.hunger).toBe(0);
  });

  test("stats do not exceed 100", () => {
    stats.energy = 99;
    stats.update(100000, "sleep");
    expect(stats.energy).toBe(100);
  });

  test("modifyHunger works", () => {
    stats.modifyHunger(30);
    expect(stats.hunger).toBe(100);
    stats.hunger = 50;
    stats.modifyHunger(20);
    expect(stats.hunger).toBe(70);
  });

  test("modifyMood works", () => {
    stats.mood = 50;
    stats.modifyMood(-30);
    expect(stats.mood).toBe(20);
  });

  test("modifyEnergy works", () => {
    stats.energy = 50;
    stats.modifyEnergy(-5);
    expect(stats.energy).toBe(45);
  });

  test("weight modifiers when hungry", () => {
    stats.hunger = 20;
    const mods = stats.getWeightModifiers();
    expect(mods.chew).toBeGreaterThan(1);
  });

  test("weight modifiers when tired", () => {
    stats.energy = 20;
    const mods = stats.getWeightModifiers();
    expect(mods.sleep).toBeGreaterThan(1);
    expect(mods.walk).toBeLessThan(1);
  });

  test("no weight modifiers when all stats are high", () => {
    const mods = stats.getWeightModifiers();
    expect(Object.keys(mods).length).toBe(0);
  });

  test("critical alert when hungry", () => {
    stats.hunger = 20;
    const alert = stats.getCriticalAlert();
    expect(alert).toBeTruthy();
  });

  test("no critical alert when all stats are high", () => {
    const alert = stats.getCriticalAlert();
    expect(alert).toBeNull();
  });
});