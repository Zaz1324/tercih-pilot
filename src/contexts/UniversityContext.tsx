import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import type {
  UniversityFormValues,
  UniversityProgram,
} from "../types/university";
import {
  createId,
  loadUniversities,
  normalizePreferenceOrders,
  saveUniversities,
} from "../utils/storage";
import { useToast } from "./ToastContext";

interface UniversityContextValue {
  universities: UniversityProgram[];
  addUniversity: (values: UniversityFormValues) => void;
  updateUniversity: (id: string, values: UniversityFormValues) => void;
  deleteUniversity: (id: string) => void;
  addToPreferenceList: (id: string) => void;
  removeFromPreferenceList: (id: string) => void;
  reorderPreferenceList: (orderedIds: string[]) => void;
  replaceUniversities: (
    universities: UniversityProgram[],
    message?: string,
  ) => void;
  clearUniversities: () => void;
}

const UniversityContext = createContext<UniversityContextValue | null>(null);

export function UniversityProvider({ children }: { children: ReactNode }) {
  const [universities, setUniversities] =
    useState<UniversityProgram[]>(loadUniversities);
  const { notify } = useToast();

  useEffect(() => {
    if (!saveUniversities(universities)) {
      notify(
        "Veriler tarayıcıya kaydedilemedi. Depolama iznini kontrol et.",
        "error",
      );
    }
  }, [universities, notify]);

  const addUniversity = (values: UniversityFormValues) => {
    const now = new Date().toISOString();
    const university: UniversityProgram = {
      ...values,
      id: createId("university"),
      preferenceOrder: 0,
      createdAt: now,
      updatedAt: now,
    };

    setUniversities((current) => [...current, university]);
    notify("Üniversite kaydı eklendi.");
  };

  const updateUniversity = (id: string, values: UniversityFormValues) => {
    setUniversities((current) =>
      current.map((university) =>
        university.id === id
          ? {
              ...university,
              ...values,
              updatedAt: new Date().toISOString(),
            }
          : university,
      ),
    );
    notify("Üniversite kaydı güncellendi.");
  };

  const deleteUniversity = (id: string) => {
    setUniversities((current) =>
      normalizePreferenceOrders(
        current.filter((university) => university.id !== id),
      ),
    );
    notify("Üniversite kaydı silindi.", "info");
  };

  const addToPreferenceList = (id: string) => {
    setUniversities((current) => {
      const nextOrder = current.reduce(
        (highest, university) =>
          Math.max(highest, university.preferenceOrder),
        0,
      );

      return current.map((university) =>
        university.id === id && university.preferenceOrder === 0
          ? {
              ...university,
              preferenceOrder: nextOrder + 1,
              updatedAt: new Date().toISOString(),
            }
          : university,
      );
    });
    notify("Tercih listesine eklendi.");
  };

  const removeFromPreferenceList = (id: string) => {
    setUniversities((current) =>
      normalizePreferenceOrders(
        current.map((university) =>
          university.id === id
            ? {
                ...university,
                preferenceOrder: 0,
                updatedAt: new Date().toISOString(),
              }
            : university,
        ),
      ),
    );
    notify("Tercih listesinden çıkarıldı.", "info");
  };

  const reorderPreferenceList = (orderedIds: string[]) => {
    const orderMap = new Map(
      orderedIds.map((id, index) => [id, index + 1] as const),
    );

    setUniversities((current) =>
      current.map((university) => ({
        ...university,
        preferenceOrder:
          university.preferenceOrder > 0
            ? (orderMap.get(university.id) ?? university.preferenceOrder)
            : 0,
      })),
    );
  };

  const replaceUniversities = (
    nextUniversities: UniversityProgram[],
    message = "Veriler başarıyla içe aktarıldı.",
  ) => {
    setUniversities(normalizePreferenceOrders(nextUniversities));
    notify(message);
  };

  const clearUniversities = () => {
    setUniversities([]);
    notify("Tüm veriler silindi.", "info");
  };

  return (
    <UniversityContext.Provider
      value={{
        universities,
        addUniversity,
        updateUniversity,
        deleteUniversity,
        addToPreferenceList,
        removeFromPreferenceList,
        reorderPreferenceList,
        replaceUniversities,
        clearUniversities,
      }}
    >
      {children}
    </UniversityContext.Provider>
  );
}

export function useUniversities(): UniversityContextValue {
  const context = useContext(UniversityContext);
  if (!context) {
    throw new Error(
      "useUniversities, UniversityProvider içinde kullanılmalı.",
    );
  }

  return context;
}
