import { createAuthBody, createBaseBody, VesyncClient } from "../../api/client";
import { HumidiferStatus, RGBNightLightType } from "./status";
import { VesyncHumidifer } from "./vesyncHumidifer";

function createStatusBody() {
  return {
    appVersion: "V2.9.35 build3",
    phoneBrand: "HomeBridge-Vesync",
    phoneOS: "HomeBridge-Vesync",
    traceId: Date.now(),
  };
}

export class HumidiferController {
  private status: HumidiferStatus;

  constructor(
    private readonly humidifer: VesyncHumidifer,
    private readonly client: VesyncClient
  ) {}

  async getStatus(): Promise<HumidiferStatus> {
    const res = await this.client
      .post("cloud/v2/deviceManaged/bypassV2", {
        headers: {
          ...this.client.createHeaders(),
        },
        json: {
          ...createBaseBody(),
          ...createAuthBody(this.client),
          ...createStatusBody(),
          payload: {
            method: "getHumidifierStatus",
            data: {},
          },
          cid: this.humidifer.cid,
          method: "bypassV2",
        },
      })
      .json<{ result: { result: HumidiferStatus } }>();
    this.status = res.result.result;

    return res.result.result;
  }

  setPower(enabled: boolean) {
    this.status.enabled = enabled;
    return this.client
      .post("cloud/v2/deviceManaged/bypassV2", {
        headers: {
          ...this.client.createHeaders(),
        },
        json: {
          ...createBaseBody(),
          ...createAuthBody(this.client),
          ...createStatusBody(),
          payload: {
            method: "setSwitch",
            data: {
              id: 0,
              enabled,
            },
          },
          cid: this.humidifer.cid,
          method: "bypassV2",
        },
      })
      .json();
  }

  setRGBNightLight(lightStatus: RGBNightLightType) {
    this.status.rgbNightLight = lightStatus;
    return this.client
      .post("cloud/v2/deviceManaged/bypassV2", {
        headers: {
          ...this.client.createHeaders(),
        },
        json: {
          ...createBaseBody(),
          ...createAuthBody(this.client),
          ...createStatusBody(),
          payload: {
            method: "setLightStatus",
            data: {
              ...lightStatus,
            },
          },
          cid: this.humidifer.cid,
          method: "bypassV2",
        },
      })
      .json();
  }

  setAutomaticStop(enabled: boolean) {
    this.status.configuration.automatic_stop = enabled;
    return this.client
      .post("cloud/v2/deviceManaged/bypassV2", {
        headers: {
          ...this.client.createHeaders(),
        },
        json: {
          ...createBaseBody(),
          ...createAuthBody(this.client),
          ...createStatusBody(),
          payload: {
            method: "setAutomaticStop",
            data: {
              enabled,
            },
          },
          cid: this.humidifer.cid,
          method: "bypassV2",
        },
      })
      .json();
  }

  setTargetHumidity(target: number) {
    if (this.enabled === false) return;

    this.status.configuration.auto_target_humidity = target;
    return this.client
      .post("cloud/v2/deviceManaged/bypassV2", {
        headers: {
          ...this.client.createHeaders(),
        },
        json: {
          ...createBaseBody(),
          ...createAuthBody(this.client),
          ...createStatusBody(),
          payload: {
            method: "setTargetHumidity",
            data: {
              target_humidity: target,
            },
          },
          cid: this.humidifer.cid,
          method: "bypassV2",
        },
      })
      .json();
  }

  get enabled(): boolean {
    return this.status.enabled;
  }

  get humidity(): number {
    return this.status.humidity;
  }

  get display(): boolean {
    return this.status.display;
  }

  get rgbNightLight(): RGBNightLightType {
    return this.status.rgbNightLight;
  }

  get targetHumidity(): number {
    return this.status.configuration.auto_target_humidity;
  }

  get waterLacks(): boolean {
    return this.status.water_lacks;
  }
}
