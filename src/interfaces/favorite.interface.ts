import { ObjectId } from "mongoose";

export interface IFavorite extends Document {
  riotGameName: string;
  riotTagLine: string;
  puuid: string;
  user: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
