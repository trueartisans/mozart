import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/../lib/mongodb';
import Flow from '@/models/Flow';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase();

  if (req.method === 'GET') {
    try {
      const { journeyId } = req.query;
      const query = journeyId ? { journeyId } : {};
      const flows = await Flow.find(query).sort({ position: 1 });
      return res.status(200).json(flows);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch flows' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { journeyId, name, description, position } = req.body;

      const flow = await Flow.create({
        journeyId,
        name,
        description,
        position,
      });

      // Create an empty flow definition
      const FlowDefinition = require('../../../models/FlowDefinition').default;
      await FlowDefinition.create({
        flowId: flow._id,
        nodes: [],
        edges: [],
        version: 1,
      });

      return res.status(201).json(flow);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create flow' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
