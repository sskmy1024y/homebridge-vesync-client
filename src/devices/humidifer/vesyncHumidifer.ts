import { OnOrOff } from "../../types";

export class VesyncHumidifer {
  name: string;
  mode: string;
  speed: number;
  uuid: string;
  cid: string;
  status: OnOrOff;

  constructor(deviceData) {
    this.name = deviceData.deviceName;
    this.mode = deviceData.mode;
    this.speed = deviceData.speed;
    this.uuid = deviceData.uuid;
    this.cid = deviceData.cid;
    this.status = deviceData.deviceStatus;
  }
}
