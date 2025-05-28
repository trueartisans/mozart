import mongoose from 'mongoose';

const FlowDefinitionSchema = new mongoose.Schema({
  flowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Flow', required: true },
  nodes: { type: Array, required: true },
  edges: { type: Array, required: true },
  version: { type: Number, default: 1 },
}, { timestamps: true });

export default mongoose.models.FlowDefinition || mongoose.model('FlowDefinition', FlowDefinitionSchema);
