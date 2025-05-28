import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/../lib/mongodb';
import Journey from '@/models/Journey';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase();

  if (req.method === 'GET') {
    try {
      const journeys = await Journey.find({}).sort({ createdAt: -1 });
      return res.status(200).json(journeys);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch journeys' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, description } = req.body;
      // In a real app, get userId from authentication
      const userId = 'user123';

      const journey = await Journey.create({
        name,
        description,
        userId,
      });

      return res.status(201).json(journey);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create journey' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
