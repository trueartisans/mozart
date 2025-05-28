import mongoose from 'mongoose';

const FlowSchema = new mongoose.Schema({
  journeyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Journey', required: true },
  name: { type: String, required: true },
  description: { type: String },
  position: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.Flow || mongoose.model('Flow', FlowSchema);
