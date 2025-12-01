import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CHART_MODULE_DEFINITIONS, ChartModuleDefinition, ChartModuleItemField, buildDefaultChartModules } from "@/constants/chartModules";
import type { ChartModuleConfig, ChartModuleItem, ChartModuleType } from "@/types/chart-modules";
import { PlusCircle, Trash2 } from "lucide-react";

interface ChartModulesBuilderProps {
  value?: ChartModuleConfig[];
  onChange: (modules: ChartModuleConfig[]) => void;
}

const ensureAllModules = (modules: ChartModuleConfig[]): ChartModuleConfig[] => {
  const map = new Map<ChartModuleType, ChartModuleConfig>();
  modules.forEach((module) => map.set(module.type, module));
  const normalized: ChartModuleConfig[] = CHART_MODULE_DEFINITIONS.map((definition, index) => {
    const existing = map.get(definition.type);
    if (existing) {
      return {
        ...existing,
        id: existing.id || `${definition.type}-${index + 1}`,
        title: existing.title || definition.title,
        enabled: existing.enabled !== false,
      };
    }
    return {
      id: `${definition.type}-${index + 1}`,
      type: definition.type,
      title: definition.title,
      enabled: true,
      items: definition.defaultItems ? JSON.parse(JSON.stringify(definition.defaultItems)) : undefined,
      settings: definition.defaultSettings ? { ...definition.defaultSettings } : undefined,
    };
  });
  modules.forEach((module) => {
    if (!CHART_MODULE_DEFINITIONS.some((definition) => definition.type === module.type)) {
      normalized.push(module);
    }
  });
  return normalized;
};

const getDefinition = (type: ChartModuleType): ChartModuleDefinition | undefined =>
  CHART_MODULE_DEFINITIONS.find((definition) => definition.type === type);

const cloneModules = (modules: ChartModuleConfig[]) => modules.map((module) => ({ ...module, items: module.items ? [...module.items] : undefined, settings: module.settings ? { ...module.settings } : undefined }));

const ChartModulesBuilder = ({ value, onChange }: ChartModulesBuilderProps) => {
  const normalizedValue = ensureAllModules(value && value.length > 0 ? value : buildDefaultChartModules());

  const updateModules = (nextModules: ChartModuleConfig[]) => {
    onChange(nextModules);
  };

  const updateModule = (type: ChartModuleType, updater: (module: ChartModuleConfig) => ChartModuleConfig) => {
    const next = cloneModules(normalizedValue).map((module) => (module.type === type ? updater(module) : module));
    updateModules(next);
  };

  const handleToggle = (type: ChartModuleType, checked: boolean) => {
    updateModule(type, (module) => ({ ...module, enabled: checked }));
  };

  const handleSettingChange = (type: ChartModuleType, key: string, value: string) => {
    updateModule(type, (module) => ({
      ...module,
      settings: { ...(module.settings || {}), [key]: value },
    }));
  };

  const handleItemChange = (
    type: ChartModuleType,
    index: number,
    field: keyof ChartModuleItem,
    value: string,
  ) => {
    updateModule(type, (module) => {
      const nextItems = module.items ? [...module.items] : [];
      if (!nextItems[index]) nextItems[index] = { key: "", label: "" };
      if (field === "maxScore") {
        nextItems[index][field] = value === "" ? undefined : Number(value);
      } else {
        nextItems[index][field] = value;
      }
      return { ...module, items: nextItems };
    });
  };

  const handleAddItem = (type: ChartModuleType) => {
    const definition = getDefinition(type);
    const newItem: ChartModuleItem =
      definition?.defaultItems && definition.defaultItems.length > 0
        ? { ...definition.defaultItems[0] }
        : { key: `${type}_${Date.now()}`, label: "" };
    if (!newItem.key || newItem.key === definition?.defaultItems?.[0]?.key) {
      newItem.key = `${type}_${Date.now()}`;
    }
    updateModule(type, (module) => ({
      ...module,
      items: [...(module.items || []), newItem],
    }));
  };

  const handleRemoveItem = (type: ChartModuleType, index: number) => {
    updateModule(type, (module) => {
      if (!module.items) return module;
      const nextItems = module.items.filter((_, idx) => idx !== index);
      return { ...module, items: nextItems };
    });
  };

  return (
    <div className="space-y-4">
      {CHART_MODULE_DEFINITIONS.map((definition) => {
        const module = normalizedValue.find((entry) => entry.type === definition.type)!;
        const isEnabled = module.enabled !== false;
        return (
          <Card key={definition.type} className="border border-slate-200/80">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="text-base">{definition.title}</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">{definition.description}</CardDescription>
              </div>
              <Switch checked={isEnabled} onCheckedChange={(checked) => handleToggle(definition.type, checked)} />
            </CardHeader>
            <CardContent className="space-y-4">
              {definition.supportsItems && (
                <div className="space-y-3">
                  <Label className="text-xs text-slate-500">{definition.itemLabel || "آیتم‌ها"}</Label>
                  {(!module.items || module.items.length === 0) && (
                    <p className="text-xs text-muted-foreground">هیچ آیتمی ثبت نشده است.</p>
                  )}
                  <div className="space-y-3">
                    {module.items?.map((item, index) => (
                      <div
                        key={`${module.type}-item-${index}`}
                        className="grid gap-2 rounded-2xl border border-slate-100/80 p-3 md:grid-cols-2 lg:grid-cols-4"
                      >
                        {definition.itemFields?.map((field) => (
                          <div key={field.key as string} className="space-y-1">
                            <Label className="text-xs text-slate-500">{field.label}</Label>
                            <Input
                              type={field.type === "number" ? "number" : "text"}
                              value={
                                field.type === "number"
                                  ? item[field.key as keyof ChartModuleItem] ?? ""
                                  : (item[field.key as keyof ChartModuleItem] as string) ?? ""
                              }
                              disabled={!isEnabled}
                              placeholder={field.placeholder}
                              onChange={(event) => handleItemChange(module.type, index, field.key, event.target.value)}
                            />
                          </div>
                        ))}
                        <div className="flex items-end justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={!isEnabled}
                            onClick={() => handleRemoveItem(module.type, index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!isEnabled}
                    onClick={() => handleAddItem(module.type)}
                    className="text-xs"
                  >
                    <PlusCircle className="ml-2 h-4 w-4" />
                    افزودن {definition.itemLabel || "آیتم"}
                  </Button>
                </div>
              )}

              {definition.settingsFields && definition.settingsFields.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2">
                  {definition.settingsFields.map((setting) => (
                    <div key={`${module.type}-setting-${setting.key}`} className="space-y-1">
                      <Label className="text-xs text-slate-500">{setting.label}</Label>
                      <Input
                        type={setting.type === "number" ? "number" : "text"}
                        value={(module.settings?.[setting.key] as string) ?? ""}
                        disabled={!isEnabled}
                        placeholder={setting.placeholder}
                        onChange={(event) => handleSettingChange(module.type, setting.key, event.target.value)}
                      />
                    </div>
                  ))}
                </div>
              )}

              {!definition.supportsItems && !definition.settingsFields && (
                <p className="text-xs text-muted-foreground">
                  این ماژول فقط با فعال بودن، AI را ملزم به ساخت داده‌های مربوطه می‌کند و تنظیم اضافه‌ای ندارد.
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ChartModulesBuilder;
