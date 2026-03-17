import mongoose from 'mongoose';

const migration = {
  version: 1,
  description: 'Set isEmailVerified: false for users without it',

  async migrate() {
    const db = mongoose.connection.db;
    if (!db) throw new Error('Database connection not available');

    const usersCollection = db.collection('users');

    const cursor = usersCollection.find({ isEmailVerified: { $exists: false } });
    const userIds: unknown[] = [];

    for await (const doc of cursor) {
      userIds.push(doc._id);
    }

    if (!userIds.length) return;

    const batchSize = 50;

    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      await usersCollection.updateMany({ _id: { $in: batch } }, { $set: { isEmailVerified: false } });
    }
  },
};

export default migration;
