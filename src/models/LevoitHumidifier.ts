import { CronJob } from 'cron';
import {
  API,
  CharacteristicValue,
  Logging,
  PlatformAccessory,
  Service,
  WithUUID
} from "homebridge";
import { client } from "../api/client";
import { HumidiferController } from "../devices/humidifer/controller";
import { VesyncHumidifer } from "../devices/humidifer/vesyncHumidifer";

export class LevoitHumidifier {
  private readonly humidifierService: Service;
  private readonly humidifierSensorService: Service;
  private job: CronJob;

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
    ).setCharacteristic(hap.Characteristic.Manufacturer, "VeSync")
    
    this.humidifierSensorService = this.getOrAddService(
      hap.Service.HumiditySensor
    );

    fanController.getStatus().then(() => {
      this.addEventListener(fanController)
    })

    this.job = new CronJob({
      cronTime: "*/1 * * * *",
      onTick: async () => {
        this.log("> [Schedule]");
        this.log(">> [Request]");
        await fanController.getStatus().then(() => {
          this.log(">>> [Update] HumidiferStatus");
        })
      },
      runOnInit: false,
    })
    this.job.start();
  }

  private addEventListener(controller: HumidiferController) {
    const hap = this.api.hap;

    this.humidifierService
      .getCharacteristic(hap.Characteristic.Active)
      .onGet(() => {
        const isOn = controller.enabled;
        return isOn
          ? hap.Characteristic.Active.ACTIVE
          : hap.Characteristic.Active.INACTIVE;
      })
      .onSet((value: CharacteristicValue) => {
        const power = value === hap.Characteristic.Active.ACTIVE;
        this.log(`>> [request] status => ${power ? 'enable' : 'disable'}`);
        controller.setPower(power);
        return value;
      });

    this.humidifierService
      .getCharacteristic(hap.Characteristic.CurrentHumidifierDehumidifierState)
      .onGet(() => {
        return hap.Characteristic.CurrentHumidifierDehumidifierState.HUMIDIFYING;
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
        return controller.targetHumidity;
      });

    this.humidifierService
      .getCharacteristic(hap.Characteristic.TargetRelativeHumidity)
      .updateValue(controller.targetHumidity);

    this.humidifierService
      .getCharacteristic(hap.Characteristic.WaterLevel)
      .onGet(() => controller.waterLacks ? 0 : 100);

    this.humidifierSensorService
      .getCharacteristic(hap.Characteristic.CurrentRelativeHumidity)
      .updateValue(controller.humidity);
  }

  private getOrAddService<T extends WithUUID<typeof Service>>(
    service: T
  ): Service {
    return (
      this.accessory.getService(service) ?? this.accessory.addService(service)
    )
  }
}
