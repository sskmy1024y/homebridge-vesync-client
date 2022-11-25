import { OnOrOff } from "../../types";

export type FanSpeed = 1 | 2 | 3;

export type HumidiferMode = "sleep";

export type ColorModeType = "marguee" | "color";

export type RGBNightLightType = {
  action: OnOrOff;
  speed: number;
  green: number;
  brightness: number;
  blue: number;
  red: number;
  colorMode: ColorModeType;
  colorSliderLocation: number;
};

export interface HumidiferStatus {
  water_tank_lifted: boolean;
  humidity: number;
  display: boolean;
  water_lacks: boolean;
  configuration: {
    display: boolean;
    auto_target_humidity: number;
    automatic_stop: boolean;
  };
  mode: HumidiferMode;
  rgbNightLight: RGBNightLightType;
  enabled: boolean;
  mist_virtual_level: number;
  extention: {
    timer_remain: number;
    schedule_count: number;
  };
  humidity_high: boolean;
  automatic_stop_reach_target: boolean;
  mist_level: number;
}
