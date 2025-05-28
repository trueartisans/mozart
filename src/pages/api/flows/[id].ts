import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/../lib/mongodb';
import Flow from '@/models/Flow';
import FlowDefinition from '@/models/FlowDefinition';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase();
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const flow = await Flow.findById(id);
      if (!flow) {
        return res.status(404).json({ error: 'Flow not found' });
      }
      return res.status(200).json(flow);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch flow' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { name, description, position } = req.body;
      const flow = await Flow.findByIdAndUpdate(
        id,
        { name, description, position },
        { new: true }
      );

      if (!flow) {
        return res.status(404).json({ error: 'Flow not found' });
      }

      return res.status(200).json(flow);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update flow' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const flow = await Flow.findByIdAndDelete(id);
      if (!flow) {
        return res.status(404).json({ error: 'Flow not found' });
      }

      // Delete associated flow definition
      await FlowDefinition.deleteMany({ flowId: id });

      return res.status(200).json({ message: 'Flow deleted successfully' });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete flow' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
