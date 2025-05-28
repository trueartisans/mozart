import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/../lib/mongodb';
import Journey from '@/models/Journey';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase();
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const journey = await Journey.findById(id);
      if (!journey) {
        return res.status(404).json({ error: 'Journey not found' });
      }
      return res.status(200).json(journey);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch journey' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { name, description } = req.body;
      const journey = await Journey.findByIdAndUpdate(
        id,
        { name, description },
        { new: true }
      );

      if (!journey) {
        return res.status(404).json({ error: 'Journey not found' });
      }

      return res.status(200).json(journey);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update journey' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const journey = await Journey.findByIdAndDelete(id);
      if (!journey) {
        return res.status(404).json({ error: 'Journey not found' });
      }
      return res.status(200).json({ message: 'Journey deleted successfully' });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete journey' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
