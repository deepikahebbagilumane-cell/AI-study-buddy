export interface ChatMessage {
  id: string;
  userId: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
}

const CHAT_STORAGE_KEY = 'study_buddy_chats'; // Keeping for potential migration if needed, but no longer used for primary storage

export const chatService = {
  async getHistory(): Promise<ChatMessage[]> {
    try {
      const savedUser = localStorage.getItem('study_buddy_user');
      const user = savedUser ? JSON.parse(savedUser) : null;
      const userId = user?.id || user?._id;

      if (!userId) return [];

      const response = await fetch(`/api/chat/history/${userId}`);
      if (!response.ok) throw new Error("Failed to fetch history");
      
      const history = await response.json();
      return history.map((m: any) => ({
        id: m._id,
        userId: m.userId,
        role: m.role,
        text: m.text,
        timestamp: m.timestamp
      }));
    } catch (err) {
      console.error("Chat history fetch error:", err);
      return [];
    }
  },

  async saveMessage(role: "user" | "model", text: string): Promise<ChatMessage | null> {
    try {
      const savedUser = localStorage.getItem('study_buddy_user');
      const user = savedUser ? JSON.parse(savedUser) : null;
      const userId = user?.id || user?._id;

      if (!userId) return null;

      const response = await fetch('/api/chat/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role, text })
      });

      if (!response.ok) throw new Error("Failed to save message");
      
      const m = await response.json();
      return {
        id: m._id,
        userId: m.userId,
        role: m.role,
        text: m.text,
        timestamp: m.timestamp
      };
    } catch (err) {
      console.error("Save message error:", err);
      return null;
    }
  }
};
