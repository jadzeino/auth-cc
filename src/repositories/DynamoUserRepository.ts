import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  DeleteItemCommand,
  UpdateItemCommand,
  UpdateItemCommandInput,
  ListTablesCommand,
  CreateTableCommand,
  ScanCommand,
  BatchWriteItemCommand,
} from '@aws-sdk/client-dynamodb';

import {marshall, unmarshall} from '@aws-sdk/util-dynamodb';
import {UserRepository} from './UserRepository';
import {User} from '../entities/User';

const isLocal = process.env.TEST_ENV === 'local';

export class DynamoUserRepository implements UserRepository {
  private dynamoDB: DynamoDBClient;
  private tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
    this.dynamoDB = isLocal
      ? new DynamoDBClient({
          region: 'localhost',
          endpoint: 'http://localhost:8000',
        })
      : new DynamoDBClient({});
  }

  async createTableIfNotExists(): Promise<void> {
    const createTableCommand = new CreateTableCommand({
      TableName: this.tableName,
      KeySchema: [{AttributeName: 'username', KeyType: 'HASH'}],
      AttributeDefinitions: [{AttributeName: 'username', AttributeType: 'S'}],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    });

    try {
      const command = new ListTablesCommand({});
      const results = await this.dynamoDB.send(command);
      if (!results.TableNames?.includes(this.tableName)) {
        // Create the table since it doesn't exist
        await this.dynamoDB.send(createTableCommand);
      } else {
        return;
      }
    } catch (error) {
      console.error('Error checking or creating table:', error);
    }
  }

  async getUser(username: string): Promise<User | null> {
    try {
      const params = {
        TableName: this.tableName,
        Key: marshall({username}),
      };

      const result = await this.dynamoDB.send(new GetItemCommand(params));
      if (!result.Item) return null;

      return unmarshall(result.Item) as User;
    } catch (error) {
      console.error('Error getting user:', error);
      throw new Error('Failed to retrieve user');
    }
  }

  async createUser(user: User): Promise<void> {
    try {
      const params = {
        TableName: this.tableName,
        Item: marshall(user),
        ConditionExpression: 'attribute_not_exists(username)',
      };

      await this.dynamoDB.send(new PutItemCommand(params));
    } catch (error: any) {
      if (error.name === 'ConditionalCheckFailedException') {
        throw new Error('User with the same username already exists.');
      }
      console.error('Error saving user:', error);
      throw new Error('Failed to save user');
    }
  }

  async deleteUser(username: string): Promise<void> {
    try {
      const params = {
        TableName: this.tableName,
        Key: marshall({username}),
      };

      await this.dynamoDB.send(new DeleteItemCommand(params));
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  }

  async updateUser(user: User): Promise<void> {
    try {
      const params: UpdateItemCommandInput = {
        TableName: this.tableName,
        Key: marshall({username: user.username}),
        UpdateExpression: 'SET #password = :passwordValue',
        ExpressionAttributeNames: {
          '#password': 'password',
        },
        ExpressionAttributeValues: {
          ':passwordValue': {S: user.password},
        },
      };

      await this.dynamoDB.send(new UpdateItemCommand(params));
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Failed to update user');
    }
  }

  async clearTable(): Promise<void> {
    try {
      const scanResult = await this.dynamoDB.send(
        new ScanCommand({TableName: this.tableName}),
      );
      if (!scanResult.Items || scanResult.Items.length === 0) {
        return; // Table is already empty.
      }

      const deleteRequests = scanResult.Items.map(item => {
        return {
          DeleteRequest: {
            Key: marshall({username: unmarshall(item).username}),
          },
        };
      });

      const batchWriteParams = {
        RequestItems: {
          [this.tableName]: deleteRequests,
        },
      };

      await this.dynamoDB.send(new BatchWriteItemCommand(batchWriteParams));
    } catch (error) {
      console.error('Error clearing table:', error);
      throw new Error('Failed to clear table');
    }
  }
}
