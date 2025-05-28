import mongoose from 'mongoose';

const JourneySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  userId: { type: String, required: true },
}, { timestamps: true });

export default mongoose.models.Journey || mongoose.model('Journey', JourneySchema);
