"use client";

import type { ProductOptionGroup } from "@/data/menuData";

interface ProductOptionsEditorProps {
  groups: ProductOptionGroup[];
  onChange: (groups: ProductOptionGroup[]) => void;
}

export default function ProductOptionsEditor({ groups, onChange }: ProductOptionsEditorProps) {
  const addGroup = () => onChange([
    ...groups,
    { id: `group-${Date.now()}`, name: "مكونات المنتج", required: false, multiple: true, options: [] },
  ]);

  const addMealIngredients = () => {
    const groupId = `meal-ingredients-${Date.now()}`;
    const names = ["ثومية", "بطاطس", "مخلل"];
    onChange([
      ...groups,
      {
        id: groupId,
        name: "مكونات الوجبة",
        required: false,
        multiple: true,
        options: names.map((name, index) => ({
          id: `${groupId}-${index + 1}`,
          name,
          priceAdjustment: 0,
          defaultSelected: true,
        })),
      },
    ]);
  };

  const updateGroup = (groupId: string, update: Partial<ProductOptionGroup>) => {
    onChange(groups.map((group) => group.id === groupId ? { ...group, ...update } : group));
  };

  const addOption = (groupId: string) => {
    onChange(groups.map((group) => group.id === groupId
      ? { ...group, options: [...group.options, { id: `option-${Date.now()}`, name: "اختيار", priceAdjustment: 0 }] }
      : group,
    ));
  };

  const updateOption = (groupId: string, optionId: string, update: { name?: string; priceAdjustment?: number; defaultSelected?: boolean }) => {
    onChange(groups.map((group) => group.id === groupId
      ? { ...group, options: group.options.map((option) => option.id === optionId ? { ...option, ...update } : option) }
      : group,
    ));
  };

  return (
    <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/70 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-blue-900">مكونات واختيارات المنتج</p>
        <div className="flex flex-wrap justify-end gap-1.5">
          <button type="button" onClick={addMealIngredients} className="rounded-full border border-blue-200 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100">+ ثومية وبطاطس ومخلل</button>
          <button type="button" onClick={addGroup} className="rounded-full bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700">+ مكونات</button>
        </div>
      </div>
      {groups.length === 0 && <p className="text-xs text-blue-800/60">أضف مكونات مثل الثومية والبطاطس والمخلل؛ كل مكوّن يظهر للعميل بخانة مستقلة يقدر يضيفها أو يلغيها. وتقدر تعدّل الاسم والسعر من هنا.</p>}
      <div className="space-y-3">
        {groups.map((group) => (
          <div key={group.id} className="rounded-lg border border-blue-100 bg-white p-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <input
                aria-label="اسم مجموعة الاختيارات"
                value={group.name}
                onChange={(event) => updateGroup(group.id, { name: event.target.value })}
                className="min-w-0 flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-gray-900"
                placeholder="مثال: الحجم"
              />
              <label className="flex items-center gap-1 text-xs text-gray-600">
                <input type="checkbox" checked={group.required} onChange={(event) => updateGroup(group.id, { required: event.target.checked })} />
                مطلوب
              </label>
              <label className="flex items-center gap-1 text-xs text-gray-600">
                <input type="checkbox" checked={group.multiple} onChange={(event) => updateGroup(group.id, { multiple: event.target.checked })} />
                أكثر من اختيار
              </label>
              <button type="button" onClick={() => onChange(groups.filter((item) => item.id !== group.id))} aria-label="حذف المجموعة" className="rounded-full px-2 py-1 text-sm text-red-500 hover:bg-red-50">حذف</button>
            </div>
            <div className="mt-2 space-y-2">
              {group.options.map((option) => (
              <div key={option.id} className="flex flex-wrap items-center gap-2">
                  <input
                    aria-label="اسم الاختيار"
                    value={option.name}
                    onChange={(event) => updateOption(group.id, option.id, { name: event.target.value })}
                    className="min-w-0 flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-gray-900"
                    placeholder="مثال: كبير"
                  />
                  <input
                    aria-label="فرق السعر"
                    type="number"
                    min="0"
                    value={option.priceAdjustment}
                    onChange={(event) => updateOption(group.id, option.id, { priceAdjustment: Math.max(0, Number(event.target.value)) })}
                    className="w-24 rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-gray-900"
                    placeholder="فرق السعر"
                  />
                  <label className="flex items-center gap-1 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={option.defaultSelected ?? false}
                      onChange={(event) => updateOption(group.id, option.id, { defaultSelected: event.target.checked })}
                    />
                    مضاف افتراضيًا
                  </label>
                  <button type="button" onClick={() => updateGroup(group.id, { options: group.options.filter((item) => item.id !== option.id) })} aria-label="حذف الاختيار" className="rounded-full px-2 text-red-500 hover:bg-red-50">×</button>
                </div>
              ))}
              <button type="button" onClick={() => addOption(group.id)} className="text-xs font-semibold text-blue-700 hover:text-blue-900">+ أضف اختيارًا وسعره</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
