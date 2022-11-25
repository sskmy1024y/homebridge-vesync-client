import {
  API,
  CharacteristicValue,
  Logging,
  PlatformAccessory,
  Service,
  WithUUID,
} from "homebridge";
import { VesyncClient } from "../api/client";
import { HumidiferController } from "../devices/humidifer/controller";
import { VesyncHumidifer } from "../devices/humidifer/vesyncHumidifer";

const client = new VesyncClient();

export class LevoitHumidifier {
  private readonly humidifierService: Service;
  private readonly humidifierSensorService: Service;

  constructor(
    private readonly device: VesyncHumidifer,
    private readonly log: Logging,
    private readonly accessory: PlatformAccessory,
    private readonly api: API
  ) {
    const fanController = new HumidiferController(device, client);
    const hap = api.hap;
    this.humidifierService = this.getOrAddService(
      hap.Service.HumidifierDehumidifier
    );

    this.humidifierService
      .getCharacteristic(hap.Characteristic.Active)
      .onGet(() => {
        const isOn = fanController.enabled;
        return isOn
          ? hap.Characteristic.Active.ACTIVE
          : hap.Characteristic.Active.INACTIVE;
      })
      .onSet((value: CharacteristicValue) => {
        const power = value === hap.Characteristic.Active.ACTIVE;
        fanController.setPower(power);
        return value;
      });

    this.humidifierService
      .getCharacteristic(hap.Characteristic.CurrentHumidifierDehumidifierState)
      .onGet(() => {
        return hap.Characteristic.CurrentHumidifierDehumidifierState
          .HUMIDIFYING;
      });

    this.humidifierService
      .getCharacteristic(hap.Characteristic.TargetHumidifierDehumidifierState)
      .onGet(() => {
        return hap.Characteristic.TargetHumidifierDehumidifierState.HUMIDIFIER;
      });

    this.humidifierService
      .getCharacteristic(hap.Characteristic.RotationSpeed)
      .setProps({ minStep: 33, maxValue: 99 })
      .onGet(() => {
        return fanController.targetHumidity;
      });

    this.humidifierSensorService = this.getOrAddService(
      hap.Service.HumiditySensor
    );
    this.humidifierSensorService
      .getCharacteristic(hap.Characteristic.CurrentRelativeHumidity)
      .onGet(() => {
        return 100;
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
