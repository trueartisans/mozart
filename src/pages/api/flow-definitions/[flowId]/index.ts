import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/../lib/mongodb';
import FlowDefinition from '@/models/FlowDefinition';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase();
  const { flowId } = req.query;

  if (req.method === 'GET') {
    try {
      const flowDefinition = await FlowDefinition.findOne({ flowId }).sort({ version: -1 });
      if (!flowDefinition) {
        return res.status(404).json({ error: 'Flow definition not found' });
      }
      return res.status(200).json(flowDefinition);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch flow definition' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { nodes, edges } = req.body;

      // Get the latest version
      const latestDefinition = await FlowDefinition.findOne({ flowId }).sort({ version: -1 });
      const newVersion = latestDefinition ? latestDefinition.version + 1 : 1;

      // Create a new version
      const flowDefinition = await FlowDefinition.create({
        flowId,
        nodes,
        edges,
        version: newVersion,
      });

      return res.status(200).json(flowDefinition);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update flow definition' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
