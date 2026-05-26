/**
 * StateMachine unit tests
 */
const fs = require("fs");
const path = require("path");

// Load work-mode dependency into global scope
const wmCode = fs.readFileSync(path.join(__dirname, "..", "renderer", "js", "work-mode.js"), "utf8");
(new Function(wmCode + "; globalThis.WorkMode = WorkMode;"))();

// Load state-machine
const smCode = fs.readFileSync(path.join(__dirname, "..", "renderer", "js", "state-machine.js"), "utf8");
const PetStateMachine = (new Function(smCode + "; return PetStateMachine;"))();

describe("PetStateMachine", () => {
  let sm;

  beforeEach(() => {
    sm = new PetStateMachine();
    sm.setScreenSize(1920, 1080);
  });

  test("initial state is idle", () => {
    expect(sm.getState()).toBe("idle");
  });

  test("transitionTo changes state", () => {
    sm.transitionTo("walk");
    expect(sm.getState()).toBe("walk");
  });

  test("handleInteraction FEED goes to chew", () => {
    sm.handleInteraction("feed");
    expect(sm.getState()).toBe("chew");
  });

  test("handleInteraction PET goes to idle", () => {
    sm.transitionTo("walk");
    sm.handleInteraction("pet");
    expect(sm.getState()).toBe("idle");
  });

  test("handleInteraction CLICK goes to dance", () => {
    sm.handleInteraction("click");
    expect(sm.getState()).toBe("dance");
  });

  test("setWeightModifiers affects pickNextState", () => {
    sm.transitionTo("idle");
    sm.setWeightModifiers({ sleep: 100, idle: 0.01, walk: 0.01, chew: 0.01, groom: 0.01, stand: 0.01 });
    sm.stateTimer = 99999;
    const nextState = sm.pickNextState();
    expect(nextState).toBe("sleep");
  });

  test("getFps returns valid fps", () => {
    const fps = sm.getFps();
    expect(fps).toBeGreaterThan(0);
  });

  test("walk state moves position", () => {
    sm.transitionTo("walk");
    sm.direction = 1;
    const startX = sm.posX;
    sm.update(100);
    expect(sm.posX).toBeGreaterThan(startX);
  });

  test("tunnel state wraps around screen", () => {
    sm.transitionTo("tunnel");
    sm.direction = 1;
    sm.posX = 9999;
    sm.update(100);
    expect(sm.posX).toBeLessThan(9999);
  });
});