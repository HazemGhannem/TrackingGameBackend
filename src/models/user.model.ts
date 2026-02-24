import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import { IUserDocument } from '../interfaces/user.interface';

const UserSchema = new Schema<IUserDocument>(
  {
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    favorites: [{ type: Schema.Types.ObjectId, ref: 'Favorite' }],
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret:any) {
        delete ret.password; 
        return ret;
      },
    },
    toObject: {
      transform(doc, ret:any) {
        delete ret.password; 
        return ret;
      },
    },
  },
);

UserSchema.pre<IUserDocument>('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.comparePassword = async function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model<IUserDocument>('User', UserSchema);
