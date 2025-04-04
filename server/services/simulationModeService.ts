import { storage } from "../storage";

class SimulationModeService {
  private enabled: boolean = true;
  private testGroupId: string = "test";
  private initialized: boolean = false;

  async initialize(): Promise<void> {
    // Initialize with settings from storage
    const settings = await storage.getAppSettings();
    if (settings) {
      this.enabled = settings.simulationMode === null ? true : settings.simulationMode;

      // Use testGroup if set, otherwise use telegramChatId
      // This ensures we always have a valid test group ID for simulations
      if (settings.testGroup && settings.testGroup.trim() !== "") {
        this.testGroupId = settings.testGroup;
      } else if (settings.telegramChatId && settings.telegramChatId.trim() !== "") {
        this.testGroupId = settings.telegramChatId;

        // Also update the testGroup setting to match telegramChatId for consistency
        await storage.updateAppSettings({
          ...settings,
          testGroup: settings.telegramChatId
        });
      }
    }

    this.initialized = true;
    console.log(`Simulation mode service initialized (Enabled: ${this.enabled}, Test Group: ${this.testGroupId})`);
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async setEnabled(enabled: boolean): Promise<void> {
    this.enabled = enabled;

    // Update settings in storage
    const settings = await storage.getAppSettings();
    if (settings) {
      await storage.updateAppSettings({
        ...settings,
        simulationMode: enabled
      });
    }
  }

  getTestGroupId(): string {
    return this.testGroupId;
  }

  async setTestGroupId(groupId: string): Promise<void> {
    this.testGroupId = groupId;

    // Update settings in storage
    const settings = await storage.getAppSettings();
    if (settings) {
      await storage.updateAppSettings({
        ...settings,
        testGroup: groupId
      });
    }
  }
}

export const simulationModeService = new SimulationModeService();
