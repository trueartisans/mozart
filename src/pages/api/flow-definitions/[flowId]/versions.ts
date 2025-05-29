import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/../lib/mongodb';
import FlowDefinition from '@/models/FlowDefinition';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase();
  const { flowId } = req.query;

  if (req.method === 'GET') {
    try {
      const versions = await FlowDefinition.find({ flowId })
        .sort({ version: -1 }) // Newest first
        .limit(50); // Limit of 50 records

      return res.status(200).json(versions);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch versions' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
