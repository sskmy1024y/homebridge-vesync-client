import {
  API,
  Categories,
  DynamicPlatformPlugin,
  Logging,
  PlatformAccessory,
  PlatformConfig,
  UnknownContext,
} from "homebridge";
import { VesyncClient } from "./api/client";
import { VesyncFan } from "./devices/fan/vesyncFan";
import { HumidiferController } from "./devices/humidifer/controller";
import { VesyncHumidifer } from "./devices/humidifer/vesyncHumidifer";
import { LevoitAirPurifier } from "./models/LevoitAirPurifier";

const client = new VesyncClient();

interface Config extends PlatformConfig {
  username: string;
  password: string;
}
class VesyncPlatform implements DynamicPlatformPlugin {
  private readonly cachedAccessories: PlatformAccessory[] = [];

  constructor(
    private readonly log: Logging,
    config: Config,
    private readonly api: API
  ) {
    this.api.on("didFinishLaunching", async () => {
      await client.login(config.username, config.password);
      await this.findDevices();
    });
  }

  private async findDevices() {
    const devices = await client.getDevices();
    devices.forEach((device) => {
      const cached = this.cachedAccessories.find((a) => a.UUID === device.uuid);
      if (cached) {
        this.log.debug("Restoring cached accessory: " + cached.displayName);
        if (cached) {
          if (device instanceof VesyncFan) {
            new LevoitAirPurifier(device, this.log, cached, this.api);
          } else if (device instanceof VesyncHumidifer) {
            new HumidiferController(device, client);
          }
        }
      } else {
        if (device instanceof VesyncFan) {
          this.log.debug("Creating new fan accessory...");
          const platformAccessory = new this.api.platformAccessory(
            device.name,
            device.uuid,
            Categories.AIR_PURIFIER
          );
          new LevoitAirPurifier(device, this.log, platformAccessory, this.api);
          this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
            platformAccessory,
          ]);
        } else if (device instanceof VesyncHumidifer) {
          this.log.debug("Creating new humidifer accessory...");
          const platformAccessory = new this.api.platformAccessory(
            device.name,
            device.uuid,
            Categories.AIR_HUMIDIFIER
          );
          new HumidiferController(device, client);
          this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
            platformAccessory,
          ]);
        }
      }
    });
  }

  /**
   * REQUIRED - Homebridge will call the "configureAccessory" method once for every cached
   * accessory restored
   */
  configureAccessory(accessory: PlatformAccessory<UnknownContext>): void {
    this.cachedAccessories.push(accessory);
  }
}

const PLUGIN_NAME = 'homebridge-vesync-client';
const PLATFORM_NAME = 'VesyncPlatform';

export = (homebridge: API) => {
    homebridge.registerPlatform(PLATFORM_NAME, VesyncPlatform);
};
