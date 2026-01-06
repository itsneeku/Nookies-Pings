import { SelectMenuComponentOptionData } from "discord.js";
import cronstrue from "cronstrue";
import { Result } from "neverthrow";

export const ID = {
  SCHEDULE_CUSTOM: "monitor_schedule_custom",

  BTN_EDIT_URL: "monitor_btn_edit_url",
  MODAL_URL: "monitor_modal_url",
  MODAL_INPUT_URL: "monitor_input_url",

  SELECT_MODULE: "monitor_select_module",

  SELECT_CRON: "monitor_select_cron",
  BTN_CUSTOM_CRON: "monitor_btn_custom_cron",
  MODAL_CRON: "monitor_modal_cron",
  MODAL_INPUT_CRON: "monitor_input_cron",

  SELECT_CHANNEL: "monitor_select_channel",

  SELECT_ROLE: "monitor_select_role",

  START: "monitor_start",
} as const;

export const MODULE_OPTIONS: SelectMenuComponentOptionData[] = [
  {
    label: "Module 1",
    description: "An example preset configuration",
    value: "preset_1",
    emoji: "⚡",
  },
];

const SCHEDULE_OPTIONS: SelectMenuComponentOptionData[] = [
  {
    label: "Every 3 Minutes",
    description: "*/3 * * * *",
    value: "*/3 * * * *",
    emoji: "3️⃣",
  },
  {
    label: "Every 5 Minutes",
    description: "*/5 * * * *",
    value: "*/5 * * * *",
    emoji: "5️⃣",
  },
];

const describeCron = Result.fromThrowable(
  (c?: string) => cronstrue.toString(c || ""),
  (e) => new Error(`Invalid cron expression: ${e}`),
);

export function getScheduleOptions(state: ScrapeJobForm) {
  const schedule = SCHEDULE_OPTIONS.map((o) => ({
    ...o,
    default: o.value === state.cron,
  }));

  if (state.cron && !SCHEDULE_OPTIONS.some((o) => o.value === state.cron)) {
    const desc = describeCron(state.cron);
    schedule.push({
      label: `Custom: ${desc.isOk() ? state.cron : "Invalid cron"}`,
      description: desc.isOk() ? desc.value : "Invalid cron expression",
      value: state.cron || "",
      emoji: "⚡",
      default: true,
    });
  }

  return [...schedule, {
    label: "Custom",
    description: "Set a custom cron schedule",
    value: ID.SCHEDULE_CUSTOM,
    emoji: "⚡",
  }];
}
