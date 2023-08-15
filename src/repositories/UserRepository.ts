import {User} from '../entities/User';

export interface UserRepository {
  // Retrieve a user by their username.
  getUser(username: string): Promise<User | null>;

  // Create a new user.
  createUser(user: User): Promise<void>;

  // Update an existing user's details.
  updateUser(user: User): Promise<void>;

  // Delete a user.
  deleteUser(username: string): Promise<void>;
}
