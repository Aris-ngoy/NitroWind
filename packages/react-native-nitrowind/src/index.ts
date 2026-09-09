import { NitroModules } from "react-native-nitro-modules";
import type { Nitrowind as NitrowindSpec } from "./specs/nitrowind.nitro";

export const Nitrowind = NitroModules.createHybridObject<NitrowindSpec>("Nitrowind");
