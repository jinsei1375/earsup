// stores/userStore.ts
import { create } from 'zustand';

type UserStore = {
  userId: string | null;
  setUserId: (id: string) => void;
};

export const useUserStore = create<UserStore>((set) => ({
  userId: null,
  setUserId: (id) => set({ userId: id }),
}));
