import * as SecureStore from 'expo-secure-store';

export type DraftEntry = {
  missionOrder: number;
  answer: string;
  funRating: number | null;
  burdenRating: number | null;
  immersionRating: number | null;
  retryRating: number | null;
  feeling: string;
};

export type Drafts = Record<number, DraftEntry>;

function storeKey(order: number) {
  return `uncovering_draft_${order}`;
}

export async function getDrafts(): Promise<Drafts> {
  const result: Drafts = {};
  for (const order of [1, 2, 3]) {
    try {
      const raw = await SecureStore.getItemAsync(storeKey(order));
      if (raw) result[order] = JSON.parse(raw);
    } catch {}
  }
  return result;
}

export async function setDraft(entry: DraftEntry): Promise<void> {
  await SecureStore.setItemAsync(storeKey(entry.missionOrder), JSON.stringify(entry));
}

export async function clearDrafts(): Promise<void> {
  for (const order of [1, 2, 3]) {
    try {
      await SecureStore.deleteItemAsync(storeKey(order));
    } catch {}
  }
}
