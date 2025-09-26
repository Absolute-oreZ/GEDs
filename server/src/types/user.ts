export interface User {
  id: string;
  username: string;
  email: string;
  learning_preference: Record<string, any>;
  profile_picture_path?: string;
}