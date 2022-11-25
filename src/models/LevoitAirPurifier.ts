import {
  API,
  CharacteristicValue,
  Logging,
  PlatformAccessory,
  Service,
  WithUUID
} from "homebridge";
import { client } from "../api/client";
import { FanController } from "../devices/fan/fanController";
import { VesyncFan } from "../devices/fan/vesyncFan";

export class LevoitAirPurifier {
  private readonly airPurifierService: Service;
  private readonly airQualityService: Service;

  constructor(
    private readonly device: VesyncFan,
    private readonly log: Logging,
    private readonly accessory: PlatformAccessory,
    private readonly api: API
  ) {
    const fanController = new FanController(device, client);
    const hap = api.hap;
    this.airPurifierService = this.getOrAddService(hap.Service.AirPurifier);

    this.airPurifierService
      .getCharacteristic(hap.Characteristic.Active)
      .onGet(() => {
        const isOn = fanController.isOn();
        return isOn
          ? hap.Characteristic.Active.ACTIVE
          : hap.Characteristic.Active.INACTIVE;
      })
      .onSet((value: CharacteristicValue) => {
        const power = value === hap.Characteristic.Active.ACTIVE;
        fanController.setPower(power);
        return value;
      });

    this.airPurifierService
      .getCharacteristic(hap.Characteristic.CurrentAirPurifierState)
      .onGet(() => {
        return hap.Characteristic.CurrentAirPurifierState.PURIFYING_AIR;
      });

    this.airPurifierService
      .getCharacteristic(hap.Characteristic.TargetAirPurifierState)
      .onGet(() => {
        return hap.Characteristic.TargetAirPurifierState.AUTO;
      });

    this.airPurifierService
      .getCharacteristic(hap.Characteristic.RotationSpeed)
      .setProps({ minStep: 33, maxValue: 99 })
      .onGet(() => {
        const level = fanController.getFanSpeed();
        return level * 33;
      });

    this.airQualityService = this.getOrAddService(hap.Service.AirQualitySensor);
    this.airQualityService
      .getCharacteristic(hap.Characteristic.AirQuality)
      .onGet(() => {
        return hap.Characteristic.AirQuality.POOR;
      });
  }

  private getOrAddService<T extends WithUUID<typeof Service>>(
    service: T
  ): Service {
    return (
      this.accessory.getService(service) ?? this.accessory.addService(service)
    );
  }
}
