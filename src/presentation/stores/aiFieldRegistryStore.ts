import { create } from "zustand";

export interface RegisteredField {
  fieldId: string;
  label: string;
  getValue: () => string;
  setValue: (val: string) => void;
}

interface AiFieldRegistryStore {
  fields: Record<string, RegisteredField>;
  register: (field: RegisteredField) => void;
  unregister: (fieldId: string) => void;
  getFieldValue: (fieldId: string) => string;
  setFieldValue: (fieldId: string, value: string) => void;
  listFields: () => Array<{ fieldId: string; label: string }>;
}

export const useAiFieldRegistryStore = create<AiFieldRegistryStore>((set, get) => ({
  fields: {},
  register: (field) => {
    set((state) => ({
      fields: { ...state.fields, [field.fieldId]: field },
    }));
  },
  unregister: (fieldId) => {
    set((state) => {
      const next = { ...state.fields };
      delete next[fieldId];
      return { fields: next };
    });
  },
  getFieldValue: (fieldId) => {
    const field = get().fields[fieldId];
    return field ? field.getValue() : "";
  },
  setFieldValue: (fieldId, value) => {
    const field = get().fields[fieldId];
    if (field) {
      field.setValue(value);
    }
  },
  listFields: () => {
    return Object.values(get().fields).map((f) => ({
      fieldId: f.fieldId,
      label: f.label,
    }));
  },
}));
