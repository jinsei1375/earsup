// stores/userStore.ts
import { create } from 'zustand';

type UserStore = {
  userId: string | null;
  nickname: string | null;
  setUserId: (id: string) => void;
  setNickname: (name: string) => void;
  setUserInfo: (id: string, name: string) => void;
};

export const useUserStore = create<UserStore>((set) => ({
  userId: null,
  nickname: null,
  setUserId: (id) => set({ userId: id }),
  setNickname: (name) => set({ nickname: name }),
  setUserInfo: (id, name) => set({ userId: id, nickname: name }),
}));
