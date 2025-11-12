import { z } from "zod";

export const nodeSize = {
  min: 1,
  max: 10,
  step: 0.1,
  default: 3, // 3
};

export const linkThickness = {
  min: 1,
  max: 3,
  step: 0.1,
  default: 2, // 3
};

export const linkDistance = {
  min: 10,
  max: 200,
  step: 1,
  default: 100, // 50
};

export const nodeRepulsion = {
  min: 2500,
  max: 3000,
  step: 100,
  default: 2800, // 28
};

export const distanceFromFocal = {
  min: 100,
  max: 500,
  step: 10,
  default: 300,
};

export enum GraphType {
  /**
   * the local graph
   */
  local = "local",
  postProcessor = "postProcessor",
}

export enum SearchEngineType {
  default = "default",
  builtIn = "builtIn",
}

const commonSetting = {
  display: {
    nodeSize: nodeSize.default,
    linkThickness: linkThickness.default,
    linkDistance: linkDistance.default,
    nodeRepulsion: nodeRepulsion.default,
    distanceFromFocal: 300,
    // node hover color is red
    nodeHoverColor: "#ff0000",
    // node hover neighbour color is green
    nodeHoverNeighbourColor: "#00ff00",
    // link hover color is blue
    linkHoverColor: "#0000ff",
    showExtension: false,
    showFullPath: false,
    showLinkArrow: true,
    dontMoveWhenDrag: false,
  },
};

// ** disaply Setting Schemas

export const BaseDisplaySettingsSchema = z.object({
  nodeSize: z.number().default(commonSetting.display.nodeSize),
  linkThickness: z.number().default(commonSetting.display.linkThickness),
  linkDistance: z.number().default(commonSetting.display.linkDistance),
  nodeRepulsion: z.number().default(commonSetting.display.nodeRepulsion),
  distanceFromFocal: z.number().default(commonSetting.display.distanceFromFocal),
  nodeHoverColor: z.string().default(commonSetting.display.nodeHoverColor),
  nodeHoverNeighbourColor: z.string().default(commonSetting.display.nodeHoverNeighbourColor),
  linkHoverColor: z.string().default(commonSetting.display.linkHoverColor),
  showExtension: z.boolean().default(commonSetting.display.showExtension),
  showFullPath: z.boolean().default(commonSetting.display.showFullPath),
  showLinkArrow: z.boolean().default(commonSetting.display.showLinkArrow),
  dontMoveWhenDrag: z.boolean().default(commonSetting.display.dontMoveWhenDrag),
});

export const LocalDisplaySettingsSchema = z.object({
  ...BaseDisplaySettingsSchema.shape,
});

// ** filter Setting Schemas

export const BaseFilterSettingsSchema = z.object({
  searchQuery: z.string(),
  showOrphans: z.boolean(),
  showAttachments: z.boolean(),
});
export const LocalFilterSettingSchema = BaseFilterSettingsSchema.merge(
  z.object({
    depth: z.number(),
    linkType: z.literal("inlinks").or(z.literal("outlinks")).or(z.literal("both")),
  })
);

// ** group Setting Schemas

export const GroupSettingsSchema = z.array(
  z.object({
    query: z.string(),
    color: z.string(),
  })
);

export const LocalGraphSettingsSchema = z.object({
  filter: LocalFilterSettingSchema,
  groups: GroupSettingsSchema,
  display: LocalDisplaySettingsSchema,
});

export const MarkdownPostProcessorGraphSettingSchema = z
  .union([
    z.object({
      /**
       * If the center file is defined, it is a local graph.
       * @remarks the file is the path of the file (with the extension) or "current"
       */
      centerFile: z.string(),
      /**
       * if center file is exist, then it should use the local schema.
       */
      filter: LocalFilterSettingSchema,
    }),
    z.object({
      centerFile: z.undefined(),
      filter: BaseFilterSettingsSchema,
    }),
  ])
  .and(
    z.object({
      /**
       * the class name will be append to the graph container
       */
      classes: z.string().default(""),
      groups: GroupSettingsSchema,
      display: BaseDisplaySettingsSchema,
    })
  );

export const SavedSettingSchema = z.object({
  title: z.string(),
  id: z.string(),
  setting: LocalGraphSettingsSchema,
  type: z.nativeEnum(GraphType),
});

export const SettingSchema = z.object({
  savedSettings: z.array(SavedSettingSchema),
  temporaryLocalGraphSetting: LocalGraphSettingsSchema,
  pluginSetting: z.object({
    baseFolder: z.string(),
    titleFontSize: z.number(),
    defaultGraphSpan: z.number(),
    linkColorTheme: z.string(),
    linkColorIn: z.string(),
    linkColorOut: z.string(),
    linkColorOther: z.string(),
    maxNodeNumber: z.number(),
    searchEngine: z.nativeEnum(SearchEngineType),
  }),
});

export type LocalGraphSettings = Prettify<z.TypeOf<typeof LocalGraphSettingsSchema>>;

export type MarkdownPostProcessorGraphSettings = Prettify<
  z.TypeOf<typeof MarkdownPostProcessorGraphSettingSchema>
>;

export type Setting = Prettify<z.TypeOf<typeof SettingSchema>>;

export type GraphSetting = Exclude<
  LocalGraphSettings | MarkdownPostProcessorGraphSettings,
  undefined
>;

export const defaultLocalGraphSetting: LocalGraphSettings = {
  filter: {
    searchQuery: "",
    showOrphans: true,
    showAttachments: false,
    depth: 1,
    linkType: "both",
  },
  groups: [],
  display: {
    ...commonSetting.display,
  },
};

export const defaultMarkdownPostProcessorGraphSetting: MarkdownPostProcessorGraphSettings = {
  centerFile: undefined,
  classes: "",
  filter: {
    searchQuery: "",
    showOrphans: true,
    showAttachments: false,
  },
  groups: [],
  display: {
    ...commonSetting.display,
  },
};
