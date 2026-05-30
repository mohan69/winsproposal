export type DrawingSymbolKind =
  | "process_source"
  | "process_destination"
  | "control_valve"
  | "severe_service_control_valve"
  | "actuator"
  | "positioner"
  | "solenoid"
  | "volume_booster"
  | "filter_regulator_airset"
  | "limit_switch"
  | "controller"
  | "instrument_signal_line"
  | "pneumatic_signal_line"
  | "process_flow_line"
  | "inspection_hold_point"
  | "document_mdr_package"
  | "material_certificate"
  | "test_report";

export type DrawingSymbolFamily = "Proposal-grade symbol" | "P&ID-lite symbol" | "PFD-style symbol";

export type DrawingSymbolDefinition = {
  kind: DrawingSymbolKind;
  label: string;
  family: DrawingSymbolFamily;
  description: string;
};

export type DrawingSymbolInstance = {
  id: string;
  kind: DrawingSymbolKind;
  label: string;
  tag?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  note?: string;
};

export const DRAWING_SYMBOL_LIBRARY: Record<DrawingSymbolKind, DrawingSymbolDefinition> = {
  process_source: {
    kind: "process_source",
    label: "Process source",
    family: "PFD-style symbol",
    description: "Incoming process stream, equipment outlet, or source boundary.",
  },
  process_destination: {
    kind: "process_destination",
    label: "Process destination",
    family: "PFD-style symbol",
    description: "Outgoing process stream, header, return line, or destination boundary.",
  },
  control_valve: {
    kind: "control_valve",
    label: "Control valve",
    family: "P&ID-lite symbol",
    description: "Proposal-stage control valve symbol.",
  },
  severe_service_control_valve: {
    kind: "severe_service_control_valve",
    label: "Severe-service control valve",
    family: "P&ID-lite symbol",
    description: "Control valve requiring severe-service trim, materials, or validation review.",
  },
  actuator: {
    kind: "actuator",
    label: "Actuator",
    family: "P&ID-lite symbol",
    description: "Valve actuator package.",
  },
  positioner: {
    kind: "positioner",
    label: "Positioner",
    family: "P&ID-lite symbol",
    description: "Valve positioner or intelligent valve controller.",
  },
  solenoid: {
    kind: "solenoid",
    label: "Solenoid",
    family: "P&ID-lite symbol",
    description: "Solenoid valve in actuator accessory package.",
  },
  volume_booster: {
    kind: "volume_booster",
    label: "Volume booster",
    family: "P&ID-lite symbol",
    description: "Booster or quick exhaust element for fast actuator response.",
  },
  filter_regulator_airset: {
    kind: "filter_regulator_airset",
    label: "Filter regulator / airset",
    family: "P&ID-lite symbol",
    description: "Instrument air filter regulator or airset.",
  },
  limit_switch: {
    kind: "limit_switch",
    label: "Limit switch",
    family: "P&ID-lite symbol",
    description: "Open/closed position feedback or limit switch box.",
  },
  controller: {
    kind: "controller",
    label: "Controller / PLC",
    family: "P&ID-lite symbol",
    description: "Controller, PLC, DCS, or anti-surge controller bubble.",
  },
  instrument_signal_line: {
    kind: "instrument_signal_line",
    label: "Instrument signal line",
    family: "P&ID-lite symbol",
    description: "Dashed electrical or instrument signal connection.",
  },
  pneumatic_signal_line: {
    kind: "pneumatic_signal_line",
    label: "Pneumatic signal line",
    family: "P&ID-lite symbol",
    description: "Dashed pneumatic air signal connection.",
  },
  process_flow_line: {
    kind: "process_flow_line",
    label: "Process flow line",
    family: "PFD-style symbol",
    description: "Solid process flow connection.",
  },
  inspection_hold_point: {
    kind: "inspection_hold_point",
    label: "Inspection hold point",
    family: "Proposal-grade symbol",
    description: "Inspection, witness, or hold point marker.",
  },
  document_mdr_package: {
    kind: "document_mdr_package",
    label: "Document / MDR package",
    family: "Proposal-grade symbol",
    description: "Manufacturing data record or final documentation package.",
  },
  material_certificate: {
    kind: "material_certificate",
    label: "Material certificate",
    family: "Proposal-grade symbol",
    description: "MTC, material certificate, or traceability record.",
  },
  test_report: {
    kind: "test_report",
    label: "Test report",
    family: "Proposal-grade symbol",
    description: "Inspection, leakage, hydrotest, or functional test report.",
  },
};

export function getDrawingSymbolDefinition(kind: DrawingSymbolKind) {
  return DRAWING_SYMBOL_LIBRARY[kind];
}
