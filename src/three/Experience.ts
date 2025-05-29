import { Engine } from "./engine";
import { DebugController } from "./DebugController";
import { Config } from "./Config";
import { ParticlesManager } from "./ParticlesManager";

export class Experience extends Engine {
  private static instance: Experience | null = null;

  public readonly config!: Config;
  public readonly debugController!: DebugController;

  constructor(domElement: HTMLElement) {
    if (Experience.instance) return Experience.instance;
    super({ domElement });
    Experience.instance = this;

    this.config = new Config();
    this.debugController = new DebugController(this);

    this.stats.activate();
    this.camera.position.set(0, 0, 20);

    const particlesManager = new ParticlesManager(this.loader, this.viewport);
    this.scene.add(particlesManager.scene);

    this.time.events.on("tick", (time) => {
      particlesManager.update(time);
    });
    this.viewport.events.on("change", (viewport) => {
      particlesManager.resize(viewport);
    });
  }
}
